using Backend.Data;
using Backend.DTOs.Admin.Dashboard;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Admin;

public sealed class AdminDashboardController : AdminControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public AdminDashboardController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardSummaryDto>> GetSummary(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var currentMonthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var nextMonthStart = currentMonthStart.AddMonths(1);
        var previousMonthStart = currentMonthStart.AddMonths(-1);

        var totalRevenue = await _dbContext.SalesInvoices
            .SumAsync(invoice => (decimal?)invoice.Total, cancellationToken)
            ?? 0m;

        var totalInvoices = await _dbContext.SalesInvoices.CountAsync(cancellationToken);
        var currentMonthRevenue = await _dbContext.SalesInvoices
            .Where(invoice => invoice.CreatedAt >= currentMonthStart && invoice.CreatedAt < nextMonthStart)
            .SumAsync(invoice => (decimal?)invoice.Total, cancellationToken)
            ?? 0m;
        var previousMonthRevenue = await _dbContext.SalesInvoices
            .Where(invoice => invoice.CreatedAt >= previousMonthStart && invoice.CreatedAt < currentMonthStart)
            .SumAsync(invoice => (decimal?)invoice.Total, cancellationToken)
            ?? 0m;
        var currentMonthInvoices = await _dbContext.SalesInvoices
            .CountAsync(invoice => invoice.CreatedAt >= currentMonthStart && invoice.CreatedAt < nextMonthStart, cancellationToken);
        var previousMonthInvoices = await _dbContext.SalesInvoices
            .CountAsync(invoice => invoice.CreatedAt >= previousMonthStart && invoice.CreatedAt < currentMonthStart, cancellationToken);
        var totalParts = await _dbContext.Parts.CountAsync(cancellationToken);
        var lowStock = await _dbContext.Parts
            .CountAsync(part => part.StockQuantity <= part.ReorderLevel, cancellationToken);
        var activeStaff = await _dbContext.Staff
            .CountAsync(staff => staff.IsActive && staff.User.IsActive, cancellationToken);
        var activeVendors = await _dbContext.Vendors.CountAsync(cancellationToken);

        return Ok(new AdminDashboardSummaryDto(
            totalRevenue,
            RevenueChange: CalculatePercentChange(currentMonthRevenue, previousMonthRevenue),
            totalInvoices,
            InvoicesChange: CalculatePercentChange(currentMonthInvoices, previousMonthInvoices),
            totalParts,
            lowStock,
            activeStaff,
            activeVendors));
    }

    private static decimal CalculatePercentChange(decimal currentValue, decimal previousValue)
    {
        if (previousValue == 0m)
        {
            return currentValue == 0m ? 0m : 100m;
        }

        return Math.Round(((currentValue - previousValue) / previousValue) * 100m, 2);
    }

    private static decimal CalculatePercentChange(int currentValue, int previousValue)
    {
        return CalculatePercentChange((decimal)currentValue, previousValue);
    }
}
