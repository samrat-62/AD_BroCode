using Backend.Data;
using Backend.DTOs.Staff;
using Backend.Models.Credits;
using Backend.Models.Sales;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Staff;

public sealed class StaffInvoicesController : StaffControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public StaffInvoicesController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("invoices")]
    public async Task<ActionResult<IReadOnlyList<StaffInvoiceSummaryDto>>> ListInvoices(
        [FromQuery] string? search,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.SalesInvoices
            .Include(invoice => invoice.Customer)
            .ThenInclude(customer => customer!.User)
            .Include(invoice => invoice.Vehicle)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var parsedStatus = ParseInvoiceStatus(status);
            query = query.Where(invoice => invoice.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(invoice =>
                invoice.InvoiceNumber.ToLower().Contains(term) ||
                (invoice.WalkInName != null && invoice.WalkInName.ToLower().Contains(term)) ||
                (invoice.Customer != null && invoice.Customer.User.FullName.ToLower().Contains(term)));
        }

        var invoices = await query
            .OrderByDescending(invoice => invoice.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(invoices.Select(StaffDtoMapper.ToInvoiceSummaryDto).ToList());
    }

    [HttpGet("invoices/{id:guid}")]
    public async Task<ActionResult<StaffInvoiceDetailDto>> GetInvoice(
        Guid id,
        CancellationToken cancellationToken)
    {
        var invoice = await _dbContext.SalesInvoices
            .Include(item => item.Items)
            .Include(item => item.Customer)
            .ThenInclude(customer => customer!.User)
            .Include(item => item.Customer)
            .ThenInclude(customer => customer!.Vehicles)
            .Include(item => item.Vehicle)
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (invoice is null)
        {
            return NotFound(new { message = "Invoice was not found." });
        }

        return Ok(ToDetailDto(invoice));
    }

    [HttpPost("invoices/{id:guid}/mark-paid")]
    public async Task<ActionResult<StaffInvoiceDto>> MarkInvoicePaid(
        Guid id,
        CancellationToken cancellationToken)
    {
        var invoice = await _dbContext.SalesInvoices
            .Include(item => item.Customer)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (invoice is null)
        {
            return NotFound(new { message = "Invoice was not found." });
        }

        invoice.Status = InvoiceStatus.Paid;
        invoice.PaymentMethod = invoice.PaymentMethod == PaymentMethod.Credit
            ? PaymentMethod.Cash
            : invoice.PaymentMethod;
        invoice.UpdatedAt = DateTimeOffset.UtcNow;

        if (invoice.Customer is not null && invoice.Customer.CreditBalance > 0)
        {
            var paymentAmount = Math.Min(invoice.Customer.CreditBalance, invoice.Total);
            invoice.Customer.CreditBalance -= paymentAmount;

            _dbContext.CreditTransactions.Add(new CreditTransaction
            {
                CustomerId = invoice.Customer.Id,
                SalesInvoiceId = invoice.Id,
                Type = CreditTransactionType.Payment,
                Amount = paymentAmount,
                BalanceAfter = invoice.Customer.CreditBalance,
                Notes = $"Payment for {invoice.InvoiceNumber}"
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(StaffDtoMapper.ToInvoiceDto(invoice));
    }

    [HttpPost("invoices/{id:guid}/email")]
    public async Task<ActionResult<StaffActionResultDto>> SendInvoiceEmail(
        Guid id,
        SendStaffInvoiceEmailRequestDto request,
        CancellationToken cancellationToken)
    {
        var exists = await _dbContext.SalesInvoices
            .AnyAsync(invoice => invoice.Id == id, cancellationToken);

        if (!exists)
        {
            return NotFound(new { message = "Invoice was not found." });
        }

        return Ok(new StaffActionResultDto(id, request.To, DateTimeOffset.UtcNow));
    }

    private static InvoiceStatus ParseInvoiceStatus(string status)
    {
        return status.Trim().ToLowerInvariant() switch
        {
            "credit" => InvoiceStatus.Credit,
            "partial" => InvoiceStatus.Partial,
            _ => InvoiceStatus.Paid
        };
    }

    private static StaffInvoiceDetailDto ToDetailDto(SalesInvoice invoice)
    {
        return new StaffInvoiceDetailDto(
            StaffDtoMapper.ToInvoiceDto(invoice),
            invoice.Items.Select(StaffDtoMapper.ToInvoiceItemDto).ToList(),
            invoice.Customer is null ? null : StaffDtoMapper.ToCustomerDto(invoice.Customer),
            invoice.Vehicle is null ? null : StaffDtoMapper.ToVehicleDto(invoice.Vehicle),
            invoice.StaffName,
            invoice.Notes);
    }
}
