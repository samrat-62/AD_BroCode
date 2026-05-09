namespace Backend.DTOs.Customer;

public sealed record DashboardSummaryDto(
    int TotalPurchases,
    int ActiveAppointments,
    int LoyaltyPoints,
    int PendingRequests,
    decimal LifetimeSpend,
    int VehicleCount);

public sealed record ActivityItemDto(
    string Id,
    string Type,
    string Title,
    string Status,
    decimal? Amount,
    DateTimeOffset OccurredAt);
