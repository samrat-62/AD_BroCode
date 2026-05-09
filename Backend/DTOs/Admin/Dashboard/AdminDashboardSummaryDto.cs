namespace Backend.DTOs.Admin.Dashboard;

public sealed record AdminDashboardSummaryDto(
    decimal TotalRevenue,
    decimal RevenueChange,
    int TotalInvoices,
    decimal InvoicesChange,
    int TotalPartsSkus,
    int LowStockAlerts,
    int ActiveStaff,
    int ActiveVendors);
