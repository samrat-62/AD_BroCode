using Backend.Data;
using Backend.DTOs.Customer;
using Backend.Models.Customers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Customer;

[Route("api")]
public sealed class CustomerProfileController : CustomerControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public CustomerProfileController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("me")]
    public async Task<ActionResult<CustomerDto>> GetCurrentCustomer(CancellationToken cancellationToken)
    {
        var customer = await _dbContext.Customers
            .Include(item => item.User)
            .Include(item => item.NotificationSettings)
            .SingleOrDefaultAsync(item => item.UserId == CurrentUserId, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var settings = await EnsureNotificationSettings(customer, cancellationToken);
        return Ok(ToDto(customer, settings));
    }

    [HttpPut("me")]
    public async Task<ActionResult<CustomerDto>> UpdateCurrentCustomer(
        UpdateCustomerInputDto request,
        CancellationToken cancellationToken)
    {
        var customer = await _dbContext.Customers
            .Include(item => item.User)
            .Include(item => item.NotificationSettings)
            .SingleOrDefaultAsync(item => item.UserId == CurrentUserId, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            customer.User.FullName = request.FullName.Trim();
        }

        if (request.Phone is not null)
        {
            customer.Phone = request.Phone.Trim();
        }

        customer.Address = NormalizeOptionalNullable(request.Address);
        customer.DateOfBirth = request.Dob;
        customer.AvatarUrl = NormalizeOptionalNullable(request.AvatarUrl);

        var settings = await EnsureNotificationSettings(customer, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(customer, settings));
    }

    [HttpPut("me/notification-settings")]
    public async Task<ActionResult<NotificationSettingsDto>> UpdateNotificationSettings(
        NotificationSettingsDto request,
        CancellationToken cancellationToken)
    {
        var customer = await _dbContext.Customers
            .Include(item => item.NotificationSettings)
            .SingleOrDefaultAsync(item => item.UserId == CurrentUserId, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var settings = await EnsureNotificationSettings(customer, cancellationToken);
        settings.EmailInvoices = request.EmailInvoices;
        settings.AppointmentReminders = request.AppointmentReminders;
        settings.AiAlerts = request.AiAlerts;
        settings.PromotionalOffers = request.PromotionalOffers;
        settings.OverdueReminders = request.OverdueReminders;
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToSettingsDto(settings));
    }

    [HttpGet("me/loyalty")]
    public async Task<ActionResult<LoyaltyStatusDto>> GetLoyaltyStatus(CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var recentDiscounts = await _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.CustomerId == customer.Id && order.Discount > 0)
            .OrderByDescending(order => order.CreatedAt)
            .Take(5)
            .Select(order => new LoyaltyDiscountDto(order.Id, order.Discount, order.CreatedAt))
            .ToListAsync(cancellationToken);

        var tier = GetTier(customer.TotalSpend);
        var nextTier = GetNextTier(customer.TotalSpend);
        var nextThreshold = nextTier is null ? (decimal?)null : GetTierThreshold(nextTier);
        var currentThreshold = GetTierThreshold(tier);
        var progressRange = Math.Max((nextThreshold ?? currentThreshold) - currentThreshold, 1m);
        var progress = nextThreshold is null
            ? 100m
            : Math.Clamp(((customer.TotalSpend - currentThreshold) / progressRange) * 100m, 0m, 100m);

        return Ok(new LoyaltyStatusDto(
            tier,
            customer.TotalSpend,
            nextTier,
            nextThreshold,
            decimal.Round(progress, 2),
            GetBenefits(tier),
            recentDiscounts));
    }

    private async Task<CustomerNotificationSettings> EnsureNotificationSettings(
        Backend.Models.Users.Customer customer,
        CancellationToken cancellationToken)
    {
        if (customer.NotificationSettings is not null)
        {
            return customer.NotificationSettings;
        }

        var settings = new CustomerNotificationSettings
        {
            CustomerId = customer.Id
        };

        _dbContext.CustomerNotificationSettings.Add(settings);
        customer.NotificationSettings = settings;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return settings;
    }

    private static CustomerDto ToDto(
        Backend.Models.Users.Customer customer,
        CustomerNotificationSettings settings)
    {
        return new CustomerDto(
            customer.Id,
            customer.User.FullName,
            customer.User.Email,
            customer.Phone,
            customer.Address,
            customer.DateOfBirth,
            customer.AvatarUrl,
            customer.TotalSpend,
            customer.LoyaltyPoints,
            customer.CreatedAt,
            ToSettingsDto(settings));
    }

    private static NotificationSettingsDto ToSettingsDto(CustomerNotificationSettings settings)
    {
        return new NotificationSettingsDto(
            settings.EmailInvoices,
            settings.AppointmentReminders,
            settings.AiAlerts,
            settings.PromotionalOffers,
            settings.OverdueReminders);
    }

    private static string GetTier(decimal totalSpend)
    {
        if (totalSpend >= 100000m) return "Platinum";
        if (totalSpend >= 50000m) return "Gold";
        if (totalSpend >= 10000m) return "Silver";
        return "Bronze";
    }

    private static string? GetNextTier(decimal totalSpend)
    {
        if (totalSpend < 10000m) return "Silver";
        if (totalSpend < 50000m) return "Gold";
        if (totalSpend < 100000m) return "Platinum";
        return null;
    }

    private static decimal GetTierThreshold(string tier)
    {
        return tier switch
        {
            "Silver" => 10000m,
            "Gold" => 50000m,
            "Platinum" => 100000m,
            _ => 0m
        };
    }

    private static IReadOnlyList<string> GetBenefits(string tier)
    {
        return tier switch
        {
            "Platinum" => new[] { "Priority appointments", "10% loyalty discount", "Free diagnostics" },
            "Gold" => new[] { "Priority appointments", "7% loyalty discount" },
            "Silver" => new[] { "5% loyalty discount" },
            _ => new[] { "Earn loyalty points on every purchase" }
        };
    }
}
