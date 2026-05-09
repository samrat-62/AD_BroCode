namespace Backend.DTOs.Admin.Reports;

public sealed record AdminFinancialReportDto(
    AdminFinancialReportSummaryDto Summary,
    IReadOnlyList<AdminFinancialChartPointDto> ChartData,
    IReadOnlyList<AdminTopPartDto> TopParts,
    IReadOnlyList<AdminFinancialChartPointDto> TableRows);

public sealed record AdminFinancialReportSummaryDto(
    decimal TotalRevenue,
    int TotalInvoices,
    decimal AverageInvoiceValue,
    decimal NetCashReceived);

public sealed record AdminFinancialChartPointDto(
    string Date,
    decimal Revenue,
    int InvoiceCount);

public sealed record AdminTopPartDto(
    Guid PartId,
    string PartName,
    int TotalSold,
    decimal TotalRevenue);
