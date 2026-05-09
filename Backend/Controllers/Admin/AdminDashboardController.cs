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
        var totalRevenue = await _dbContext.PurchaseInvoices
            .SumAsync(invoice => (decimal?)invoice.TotalCost, cancellationToken)
            ?? 0m;

        var totalInvoices = await _dbContext.PurchaseInvoices.CountAsync(cancellationToken);
        var totalParts = await _dbContext.Parts.CountAsync(cancellationToken);
        var lowStock = await _dbContext.Parts
            .CountAsync(part => part.StockQuantity <= part.ReorderLevel, cancellationToken);
        var activeStaff = await _dbContext.Staff.CountAsync(staff => staff.IsActive, cancellationToken);
        var activeVendors = await _dbContext.Vendors.CountAsync(cancellationToken);

        return Ok(new AdminDashboardSummaryDto(
            totalRevenue,
            RevenueChange: 0,
            totalInvoices,
            InvoicesChange: 0,
            totalParts,
            lowStock,
            activeStaff,
            activeVendors));
    }
}
