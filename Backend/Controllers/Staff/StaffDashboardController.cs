using Backend.Data;
using Backend.DTOs.Staff;
using Backend.Models.Sales;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Staff;

public sealed class StaffDashboardController : StaffControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public StaffDashboardController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("dashboard/stats")]
    public async Task<ActionResult<StaffDashboardStatsDto>> GetDashboardStats(
        CancellationToken cancellationToken)
    {
        var today = new DateTimeOffset(DateTime.UtcNow.Date, TimeSpan.Zero);
        var tomorrow = today.AddDays(1);

        var todaysInvoices = _dbContext.SalesInvoices
            .AsNoTracking()
            .Where(invoice => invoice.CreatedAt >= today && invoice.CreatedAt < tomorrow);

        var salesToday = await todaysInvoices.SumAsync(invoice => invoice.Total, cancellationToken);
        var invoicesToday = await todaysInvoices.CountAsync(cancellationToken);
        var newCustomersToday = await _dbContext.Customers
            .CountAsync(customer => customer.CreatedAt >= today && customer.CreatedAt < tomorrow, cancellationToken);
        var pendingCreditTotal = await _dbContext.Customers
            .SumAsync(customer => customer.CreditBalance, cancellationToken);

        return Ok(new StaffDashboardStatsDto(
            salesToday,
            invoicesToday,
            newCustomersToday,
            pendingCreditTotal));
    }

    [HttpGet("dashboard/recent-sales")]
    public async Task<ActionResult<IReadOnlyList<StaffInvoiceSummaryDto>>> GetRecentSales(
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit, 1, 50);

        var invoices = await _dbContext.SalesInvoices
            .Include(invoice => invoice.Customer)
            .ThenInclude(customer => customer!.User)
            .Include(invoice => invoice.Vehicle)
            .AsNoTracking()
            .OrderByDescending(invoice => invoice.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return Ok(invoices.Select(StaffDtoMapper.ToInvoiceSummaryDto).ToList());
    }

    [HttpGet("dashboard/alerts")]
    public async Task<ActionResult<StaffDashboardAlertsDto>> GetDashboardAlerts(
        CancellationToken cancellationToken)
    {
        var lowStock = await _dbContext.Parts
            .AsNoTracking()
            .Where(part => part.IsActive && part.StockQuantity <= part.ReorderLevel)
            .OrderBy(part => part.StockQuantity)
            .ThenBy(part => part.Name)
            .Select(part => StaffDtoMapper.ToPartDto(part))
            .ToListAsync(cancellationToken);

        var overdueCredits = await BuildPendingCreditRows(cancellationToken);

        return Ok(new StaffDashboardAlertsDto(lowStock, overdueCredits));
    }

    private async Task<IReadOnlyList<StaffPendingCreditReportRowDto>> BuildPendingCreditRows(
        CancellationToken cancellationToken)
    {
        var customers = await _dbContext.Customers
            .Include(customer => customer.User)
            .AsNoTracking()
            .Where(customer => customer.CreditBalance > 0)
            .OrderByDescending(customer => customer.CreditBalance)
            .Take(10)
            .ToListAsync(cancellationToken);

        var customerIds = customers.Select(customer => customer.Id).ToList();
        var lastPayments = await _dbContext.CreditTransactions
            .AsNoTracking()
            .Where(transaction =>
                customerIds.Contains(transaction.CustomerId) &&
                transaction.Type == Models.Credits.CreditTransactionType.Payment)
            .GroupBy(transaction => transaction.CustomerId)
            .Select(group => new
            {
                CustomerId = group.Key,
                LastPaymentDate = group.Max(transaction => transaction.Date)
            })
            .ToDictionaryAsync(item => item.CustomerId, item => item.LastPaymentDate, cancellationToken);

        var now = DateTimeOffset.UtcNow;

        return customers
            .Select(customer =>
            {
                var basis = lastPayments.TryGetValue(customer.Id, out var lastPayment)
                    ? lastPayment
                    : customer.LastVisit ?? customer.CreatedAt;

                return new StaffPendingCreditReportRowDto(
                customer.Id,
                customer.User.FullName,
                customer.Phone,
                customer.User.Email,
                customer.CreditBalance,
                Math.Max(0, (int)Math.Floor((now - basis).TotalDays)),
                lastPayments.TryGetValue(customer.Id, out var paymentDate) ? paymentDate : null);
            })
            .ToList();
    }
}
