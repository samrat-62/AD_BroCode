using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Admin.Settings;

public sealed record AdminSettingsDto(
    string CompanyName,
    string? CompanyAddress,
    string CurrencySymbol,
    int LowStockThreshold,
    decimal LoyaltyDiscountThreshold,
    decimal LoyaltyDiscountPercentage);

public sealed record UpdateAdminSettingsRequestDto(
    [param: Required]
    [param: StringLength(200)]
    string CompanyName,

    string? CompanyAddress,

    [param: Required]
    [param: StringLength(5)]
    string CurrencySymbol,

    [param: Range(0, int.MaxValue)]
    int LowStockThreshold,

    [param: Range(0, double.MaxValue)]
    decimal LoyaltyDiscountThreshold,

    [param: Range(0, 100)]
    decimal LoyaltyDiscountPercentage);
