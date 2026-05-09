using Backend.Data;
using Backend.DTOs.Admin.Reports;
using Backend.Models.Purchasing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Admin;

public sealed class AdminReportsController : AdminControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public AdminReportsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("reports/financial")]
    public async Task<ActionResult<AdminFinancialReportDto>> GetFinancialReport(
        [FromQuery] string period = "monthly",
        [FromQuery] string? date = null,
        CancellationToken cancellationToken = default)
    {
        var range = ResolveDateRange(period, date);

        var invoices = await _dbContext.PurchaseInvoices
            .Include(invoice => invoice.LineItems)
            .AsNoTracking()
            .Where(invoice => invoice.CreatedAt >= range.Start && invoice.CreatedAt < range.End)
            .OrderBy(invoice => invoice.CreatedAt)
            .ToListAsync(cancellationToken);

        var totalRevenue = invoices.Sum(invoice => invoice.TotalCost);
        var totalInvoices = invoices.Count;
        var averageInvoice = totalInvoices == 0 ? 0 : totalRevenue / totalInvoices;

        var chartData = period.Equals("yearly", StringComparison.OrdinalIgnoreCase)
            ? BuildMonthlyChart(invoices)
            : BuildDailyChart(invoices);

        var topParts = invoices
            .SelectMany(invoice => invoice.LineItems)
            .GroupBy(item => new { item.PartId, item.PartName })
            .Select(group => new AdminTopPartDto(
                group.Key.PartId,
                group.Key.PartName,
                group.Sum(item => item.Quantity),
                group.Sum(item => item.Subtotal)))
            .OrderByDescending(item => item.TotalRevenue)
            .Take(8)
            .ToList();

        return Ok(new AdminFinancialReportDto(
            new AdminFinancialReportSummaryDto(
                totalRevenue,
                totalInvoices,
                averageInvoice,
                NetCashReceived: totalRevenue),
            chartData,
            topParts,
            chartData));
    }

    private static (DateTimeOffset Start, DateTimeOffset End) ResolveDateRange(string period, string? date)
    {
        var now = DateTimeOffset.UtcNow;

        if (period.Equals("yearly", StringComparison.OrdinalIgnoreCase))
        {
            var year = int.TryParse(date, out var parsedYear) ? parsedYear : now.Year;
            var start = new DateTimeOffset(year, 1, 1, 0, 0, 0, TimeSpan.Zero);
            return (start, start.AddYears(1));
        }

        var rawDate = date ?? $"{now.Year}-{now.Month:00}";
        var parts = rawDate.Split('-', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        var parsedMonth = parts.Length >= 2 && int.TryParse(parts[1], out var month) ? month : now.Month;
        var parsedYearForMonth = parts.Length >= 1 && int.TryParse(parts[0], out var yearForMonth)
            ? yearForMonth
            : now.Year;
        var monthStart = new DateTimeOffset(parsedYearForMonth, parsedMonth, 1, 0, 0, 0, TimeSpan.Zero);

        return (monthStart, monthStart.AddMonths(1));
    }

    private static IReadOnlyList<AdminFinancialChartPointDto> BuildDailyChart(
        IReadOnlyList<PurchaseInvoice> invoices)
    {
        return invoices
            .GroupBy(invoice => invoice.CreatedAt.UtcDateTime.Date)
            .Select(group => new AdminFinancialChartPointDto(
                group.Key.ToString("yyyy-MM-dd"),
                group.Sum(invoice => invoice.TotalCost),
                group.Count()))
            .OrderBy(point => point.Date)
            .ToList();
    }

    private static IReadOnlyList<AdminFinancialChartPointDto> BuildMonthlyChart(
        IReadOnlyList<PurchaseInvoice> invoices)
    {
        return invoices
            .GroupBy(invoice => new { invoice.CreatedAt.Year, invoice.CreatedAt.Month })
            .Select(group => new AdminFinancialChartPointDto(
                $"{group.Key.Year}-{group.Key.Month:00}",
                group.Sum(invoice => invoice.TotalCost),
                group.Count()))
            .OrderBy(point => point.Date)
            .ToList();
    }
}
