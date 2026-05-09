using Backend.Data;
using Backend.DTOs.Admin.Common;
using Backend.DTOs.Admin.Vendors;
using Backend.Models.Suppliers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Admin;

public sealed class AdminVendorsController : AdminControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public AdminVendorsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("vendors")]
    public async Task<ActionResult<PagedResponseDto<AdminVendorDto>>> ListVendors(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 15,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        limit = Math.Clamp(limit, 1, 200);

        var query = _dbContext.Vendors
            .Include(vendor => vendor.Parts)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(vendor =>
                vendor.Name.ToLower().Contains(term)
                || (vendor.ContactPerson != null && vendor.ContactPerson.ToLower().Contains(term))
                || (vendor.Email != null && vendor.Email.ToLower().Contains(term))
                || (vendor.Phone != null && vendor.Phone.Contains(term)));
        }

        var total = await query.CountAsync(cancellationToken);
        var data = await query
            .OrderBy(vendor => vendor.Name)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(vendor => ToDto(vendor))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResponseDto<AdminVendorDto>(
            data,
            total,
            page,
            limit,
            ToTotalPages(total, limit)));
    }

    [HttpGet("vendors/{id:guid}")]
    public async Task<ActionResult<AdminVendorDetailDto>> GetVendor(
        Guid id,
        CancellationToken cancellationToken)
    {
        var vendor = await _dbContext.Vendors
            .Include(vendor => vendor.Parts)
            .Include(vendor => vendor.PurchaseInvoices)
            .AsNoTracking()
            .SingleOrDefaultAsync(vendor => vendor.Id == id, cancellationToken);

        if (vendor is null)
        {
            return NotFound(new { message = "Vendor was not found." });
        }

        var totalPurchaseValue = vendor.PurchaseInvoices.Sum(invoice => invoice.TotalCost);

        return Ok(new AdminVendorDetailDto(
            vendor.Id,
            vendor.Name,
            vendor.ContactPerson,
            vendor.Phone,
            vendor.Email,
            vendor.Address,
            vendor.Notes,
            vendor.Parts.Count,
            totalPurchaseValue,
            vendor.Parts
                .OrderBy(part => part.Name)
                .Select(part => new AdminVendorPartDto(
                    part.Id,
                    part.Name,
                    part.PartNumber,
                    part.StockQuantity,
                    part.ReorderLevel,
                    part.UnitPrice))
                .ToList(),
            vendor.PurchaseInvoices
                .OrderByDescending(invoice => invoice.CreatedAt)
                .Select(invoice => new AdminVendorPurchaseInvoiceDto(
                    invoice.Id,
                    invoice.InvoiceNumber,
                    invoice.TotalCost,
                    invoice.CreatedAt))
                .ToList()));
    }

    [HttpPost("vendors")]
    public async Task<ActionResult<AdminVendorDto>> CreateVendor(
        UpsertAdminVendorRequestDto request,
        CancellationToken cancellationToken)
    {
        var vendor = new Vendor();
        ApplyRequest(vendor, request);

        _dbContext.Vendors.Add(vendor);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetVendor), new { id = vendor.Id }, ToDto(vendor));
    }

    [HttpPut("vendors/{id:guid}")]
    public async Task<ActionResult<AdminVendorDto>> UpdateVendor(
        Guid id,
        UpsertAdminVendorRequestDto request,
        CancellationToken cancellationToken)
    {
        var vendor = await _dbContext.Vendors
            .Include(vendor => vendor.Parts)
            .SingleOrDefaultAsync(vendor => vendor.Id == id, cancellationToken);

        if (vendor is null)
        {
            return NotFound(new { message = "Vendor was not found." });
        }

        ApplyRequest(vendor, request);
        vendor.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(vendor));
    }

    [HttpDelete("vendors/{id:guid}")]
    public async Task<IActionResult> DeleteVendor(Guid id, CancellationToken cancellationToken)
    {
        var vendor = await _dbContext.Vendors
            .SingleOrDefaultAsync(vendor => vendor.Id == id, cancellationToken);

        if (vendor is null)
        {
            return NotFound(new { message = "Vendor was not found." });
        }

        _dbContext.Vendors.Remove(vendor);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static AdminVendorDto ToDto(Vendor vendor)
    {
        return new AdminVendorDto(
            vendor.Id,
            vendor.Name,
            vendor.ContactPerson,
            vendor.Phone,
            vendor.Email,
            vendor.Address,
            vendor.Notes,
            vendor.Parts.Count);
    }

    private static void ApplyRequest(Vendor vendor, UpsertAdminVendorRequestDto request)
    {
        vendor.Name = request.Name.Trim();
        vendor.ContactPerson = NormalizeOptional(request.ContactPerson);
        vendor.Phone = NormalizeOptional(request.Phone);
        vendor.Email = NormalizeOptional(request.Email)?.ToLowerInvariant();
        vendor.Address = NormalizeOptional(request.Address);
        vendor.Notes = NormalizeOptional(request.Notes);
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static int ToTotalPages(int total, int limit)
    {
        return Math.Max(1, (int)Math.Ceiling(total / (double)limit));
    }
}
