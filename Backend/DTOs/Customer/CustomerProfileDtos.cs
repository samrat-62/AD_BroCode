using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Customer;

public sealed record CustomerDto(
    Guid Id,
    string FullName,
    string Email,
    string? Phone,
    string? Address,
    DateOnly? Dob,
    string? AvatarUrl,
    decimal TotalSpend,
    int LoyaltyPoints,
    DateTimeOffset CreatedAt,
    NotificationSettingsDto NotificationSettings);

public sealed record UpdateCustomerInputDto(
    [param: StringLength(200)]
    string? FullName,

    [param: StringLength(20)]
    string? Phone,

    string? Address,

    DateOnly? Dob,

    [param: StringLength(500)]
    string? AvatarUrl);

public sealed record NotificationSettingsDto(
    bool EmailInvoices,
    bool AppointmentReminders,
    bool AiAlerts,
    bool PromotionalOffers,
    bool OverdueReminders);

public sealed record LoyaltyStatusDto(
    string Tier,
    decimal TotalSpend,
    string? NextTier,
    decimal? NextTierThreshold,
    decimal ProgressPercent,
    IReadOnlyList<string> Benefits,
    IReadOnlyList<LoyaltyDiscountDto> RecentDiscounts);

public sealed record LoyaltyDiscountDto(
    Guid OrderId,
    decimal Amount,
    DateTimeOffset AppliedAt);
