using Backend.Data;
using Backend.DTOs.Admin.Purchasing;
using Backend.Models.Admin;
using Backend.Models.Purchasing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Admin;

public sealed class AdminPurchaseInvoicesController : AdminControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public AdminPurchaseInvoicesController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("purchase-invoices")]
    public async Task<ActionResult<AdminPurchaseInvoiceListResponseDto>> ListInvoices(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        limit = Math.Clamp(limit, 1, 200);

        var query = _dbContext.PurchaseInvoices
            .Include(invoice => invoice.Vendor)
            .Include(invoice => invoice.LineItems)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(invoice =>
                invoice.InvoiceNumber.ToLower().Contains(term)
                || invoice.Vendor.Name.ToLower().Contains(term));
        }

        var total = await query.CountAsync(cancellationToken);
        var totalValue = await query.SumAsync(invoice => (decimal?)invoice.TotalCost, cancellationToken) ?? 0m;
        var data = await query
            .OrderByDescending(invoice => invoice.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(invoice => new AdminPurchaseInvoiceListItemDto(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.VendorId,
                invoice.Vendor.Name,
                invoice.LineItems.Count,
                invoice.TotalCost,
                invoice.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new AdminPurchaseInvoiceListResponseDto(
            data,
            total,
            page,
            limit,
            ToTotalPages(total, limit),
            totalValue));
    }

    [HttpGet("purchase-invoices/{id:guid}")]
    public async Task<ActionResult<AdminPurchaseInvoiceDetailDto>> GetInvoice(
        Guid id,
        CancellationToken cancellationToken)
    {
        var invoice = await _dbContext.PurchaseInvoices
            .Include(invoice => invoice.Vendor)
            .Include(invoice => invoice.CreatedByUser)
            .Include(invoice => invoice.LineItems)
            .AsNoTracking()
            .SingleOrDefaultAsync(invoice => invoice.Id == id, cancellationToken);

        if (invoice is null)
        {
            return NotFound(new { message = "Purchase invoice was not found." });
        }

        return Ok(ToDetailDto(invoice));
    }

    [HttpPost("purchase-invoices")]
    public async Task<ActionResult<AdminPurchaseInvoiceDetailDto>> CreateInvoice(
        CreatePurchaseInvoiceRequestDto request,
        CancellationToken cancellationToken)
    {
        var vendor = await _dbContext.Vendors
            .SingleOrDefaultAsync(vendor => vendor.Id == request.VendorId, cancellationToken);

        if (vendor is null)
        {
            return BadRequest(new { message = "Vendor was not found." });
        }

        var requestedPartIds = request.LineItems
            .Select(item => item.PartId)
            .Distinct()
            .ToList();

        var parts = await _dbContext.Parts
            .Where(part => requestedPartIds.Contains(part.Id))
            .ToDictionaryAsync(part => part.Id, cancellationToken);

        if (parts.Count != requestedPartIds.Count)
        {
            return BadRequest(new { message = "One or more parts were not found." });
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        var invoice = new PurchaseInvoice
        {
            InvoiceNumber = await GenerateInvoiceNumber(cancellationToken),
            VendorId = vendor.Id,
            CreatedByUserId = CurrentUserId,
            Notes = NormalizeOptional(request.Notes)
        };

        foreach (var requestItem in request.LineItems)
        {
            var part = parts[requestItem.PartId];
            var stockBefore = part.StockQuantity;
            var stockAfter = stockBefore + requestItem.Quantity;
            var subtotal = requestItem.Quantity * requestItem.UnitCost;

            part.StockQuantity = stockAfter;
            part.UpdatedAt = DateTimeOffset.UtcNow;

            invoice.LineItems.Add(new PurchaseInvoiceItem
            {
                PartId = part.Id,
                PartName = part.Name,
                Quantity = requestItem.Quantity,
                UnitCost = requestItem.UnitCost,
                Subtotal = subtotal,
                StockBefore = stockBefore,
                StockAfter = stockAfter
            });

            invoice.TotalCost += subtotal;
        }

        _dbContext.PurchaseInvoices.Add(invoice);
        _dbContext.AdminNotifications.Add(new AdminNotification
        {
            Type = "success",
            Message = $"Purchase invoice {invoice.InvoiceNumber} was recorded."
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var created = await _dbContext.PurchaseInvoices
            .Include(item => item.Vendor)
            .Include(item => item.CreatedByUser)
            .Include(item => item.LineItems)
            .AsNoTracking()
            .SingleAsync(item => item.Id == invoice.Id, cancellationToken);

        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, ToDetailDto(created));
    }

    [HttpDelete("purchase-invoices/{id:guid}")]
    public async Task<IActionResult> DeleteInvoice(Guid id, CancellationToken cancellationToken)
    {
        var invoice = await _dbContext.PurchaseInvoices
            .Include(invoice => invoice.LineItems)
            .SingleOrDefaultAsync(invoice => invoice.Id == id, cancellationToken);

        if (invoice is null)
        {
            return NotFound(new { message = "Purchase invoice was not found." });
        }

        var partIds = invoice.LineItems
            .Select(item => item.PartId)
            .Distinct()
            .ToList();

        var parts = await _dbContext.Parts
            .Where(part => partIds.Contains(part.Id))
            .ToDictionaryAsync(part => part.Id, cancellationToken);

        foreach (var item in invoice.LineItems)
        {
            if (!parts.TryGetValue(item.PartId, out var part))
            {
                return Conflict(new { message = $"Part '{item.PartName}' was not found, so the invoice cannot be reversed." });
            }

            if (part.StockQuantity < item.Quantity)
            {
                return Conflict(new { message = $"Invoice cannot be deleted because '{part.Name}' stock would become negative." });
            }
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        foreach (var item in invoice.LineItems)
        {
            var part = parts[item.PartId];
            part.StockQuantity -= item.Quantity;
            part.UpdatedAt = DateTimeOffset.UtcNow;
        }

        _dbContext.PurchaseInvoices.Remove(invoice);
        _dbContext.AdminNotifications.Add(new AdminNotification
        {
            Type = "warning",
            Message = $"Purchase invoice {invoice.InvoiceNumber} was deleted."
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return NoContent();
    }

    private async Task<string> GenerateInvoiceNumber(CancellationToken cancellationToken)
    {
        var year = DateTimeOffset.UtcNow.Year;
        var prefix = $"PI-{year}-";
        var count = await _dbContext.PurchaseInvoices
            .CountAsync(invoice => invoice.InvoiceNumber.StartsWith(prefix), cancellationToken);

        return $"{prefix}{count + 1:0000}";
    }

    private static AdminPurchaseInvoiceDetailDto ToDetailDto(PurchaseInvoice invoice)
    {
        return new AdminPurchaseInvoiceDetailDto(
            invoice.Id,
            invoice.InvoiceNumber,
            invoice.VendorId,
            invoice.Vendor.Name,
            invoice.Vendor.Phone,
            invoice.TotalCost,
            invoice.LineItems.Count,
            invoice.CreatedAt,
            invoice.CreatedByUser?.FullName,
            invoice.Notes,
            invoice.LineItems
                .OrderBy(item => item.PartName)
                .Select(item => new AdminPurchaseInvoiceLineItemDto(
                    item.PartId,
                    item.PartName,
                    item.Quantity,
                    item.UnitCost,
                    item.Subtotal,
                    item.StockBefore,
                    item.StockAfter))
                .ToList());
    }

    private static int ToTotalPages(int total, int limit)
    {
        return Math.Max(1, (int)Math.Ceiling(total / (double)limit));
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
