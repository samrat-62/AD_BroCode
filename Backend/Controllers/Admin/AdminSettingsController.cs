using Backend.Data;
using Backend.DTOs.Admin.Settings;
using Backend.Models.Admin;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Admin;

public sealed class AdminSettingsController : AdminControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public AdminSettingsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("settings")]
    public async Task<ActionResult<AdminSettingsDto>> GetSettings(CancellationToken cancellationToken)
    {
        var settings = await GetOrCreateSettings(cancellationToken);
        return Ok(ToDto(settings));
    }

    [HttpPut("settings")]
    public async Task<ActionResult<AdminSettingsDto>> UpdateSettings(
        UpdateAdminSettingsRequestDto request,
        CancellationToken cancellationToken)
    {
        var settings = await GetOrCreateSettings(cancellationToken);

        settings.CompanyName = request.CompanyName.Trim();
        settings.CompanyAddress = NormalizeOptional(request.CompanyAddress);
        settings.CurrencySymbol = request.CurrencySymbol.Trim();
        settings.LowStockThreshold = request.LowStockThreshold;
        settings.LoyaltyDiscountThreshold = request.LoyaltyDiscountThreshold;
        settings.LoyaltyDiscountPercentage = request.LoyaltyDiscountPercentage;
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(settings));
    }

    private async Task<AdminSettings> GetOrCreateSettings(CancellationToken cancellationToken)
    {
        var settings = await _dbContext.AdminSettings.FirstOrDefaultAsync(cancellationToken);

        if (settings is not null)
        {
            return settings;
        }

        settings = new AdminSettings
        {
            CompanyName = "AutoParts",
            CompanyAddress = "Kathmandu, Nepal",
            CurrencySymbol = "$",
            LowStockThreshold = 10,
            LoyaltyDiscountThreshold = 5000m,
            LoyaltyDiscountPercentage = 10m
        };

        _dbContext.AdminSettings.Add(settings);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return settings;
    }

    private static AdminSettingsDto ToDto(AdminSettings settings)
    {
        return new AdminSettingsDto(
            settings.CompanyName,
            settings.CompanyAddress,
            settings.CurrencySymbol,
            settings.LowStockThreshold,
            settings.LoyaltyDiscountThreshold,
            settings.LoyaltyDiscountPercentage);
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
