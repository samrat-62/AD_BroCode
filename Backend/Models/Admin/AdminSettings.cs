namespace Backend.Models.Admin;

public sealed class AdminSettings
{
    public Guid Id { get; set; }

    public string CompanyName { get; set; } = string.Empty;

    public string? CompanyAddress { get; set; }

    public string CurrencySymbol { get; set; } = "$";

    public int LowStockThreshold { get; set; } = 10;

    public decimal LoyaltyDiscountThreshold { get; set; } = 5000m;

    public decimal LoyaltyDiscountPercentage { get; set; } = 10m;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
