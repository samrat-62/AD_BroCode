using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Staff;

public sealed record StaffDashboardStatsDto(
    decimal SalesToday,
    int InvoicesToday,
    int NewCustomersToday,
    decimal PendingCreditTotal);

public sealed record StaffDashboardAlertsDto(
    IReadOnlyList<StaffPartDto> LowStock,
    IReadOnlyList<StaffPendingCreditReportRowDto> OverdueCredits);

public sealed record StaffNotificationDto(
    Guid Id,
    string Type,
    string Title,
    string Message,
    bool Read,
    DateTimeOffset CreatedAt,
    string? Link);

public sealed record StaffPendingCreditReportRowDto(
    Guid CustomerId,
    string FullName,
    string Phone,
    string? Email,
    decimal CreditAmount,
    int DaysOverdue,
    DateTimeOffset? LastPaymentDate);

public sealed record StaffRegularCustomerReportRowDto(
    Guid CustomerId,
    string FullName,
    string Phone,
    int VisitCount,
    decimal TotalSpend,
    DateTimeOffset LastVisit);

public sealed record StaffHighSpenderReportRowDto(
    Guid CustomerId,
    string FullName,
    decimal TotalSpend,
    decimal AvgPerVisit,
    int VisitCount);

public sealed record StaffSalesSummaryReportDto(
    decimal TotalSales,
    int TotalInvoices,
    decimal AvgSaleValue,
    decimal PaidSales,
    IReadOnlyList<StaffDailySalesDto> DailySales,
    IReadOnlyList<StaffTopPartDto> TopParts);

public sealed record StaffDailySalesDto(
    string Date,
    decimal Total,
    int Invoices);

public sealed record StaffTopPartDto(
    Guid PartId,
    string PartNumber,
    string Name,
    decimal Revenue,
    int QuantitySold);

public sealed record SendStaffCreditReminderRequestDto(
    [param: Required]
    [param: EmailAddress]
    string To,

    [param: StringLength(200)]
    string? Subject,

    string? Message);
