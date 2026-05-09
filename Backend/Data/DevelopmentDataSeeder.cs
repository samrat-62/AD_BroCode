using Backend.Models.Admin;
using Backend.Models.Users;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public static class DevelopmentDataSeeder
{
    public static async Task SeedDevelopmentDataAsync(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            return;
        }

        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        await SeedAdminUser(dbContext, configuration);
        await SeedStaffUser(dbContext, configuration);
        await SeedAdminSettings(dbContext);
    }

    private static async Task SeedAdminUser(
        ApplicationDbContext dbContext,
        IConfiguration configuration)
    {
        var email = (configuration["AdminSeed:Email"] ?? "admin@autoparts.com")
            .Trim()
            .ToLowerInvariant();
        var password = configuration["AdminSeed:Password"] ?? "password123";
        var fullName = configuration["AdminSeed:FullName"] ?? "Admin User";

        var exists = await dbContext.Users.AnyAsync(user => user.Email == email);

        if (exists)
        {
            return;
        }

        dbContext.Users.Add(new User
        {
            FullName = fullName,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.Admin,
            IsActive = true
        });

        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedStaffUser(
        ApplicationDbContext dbContext,
        IConfiguration configuration)
    {
        var email = (configuration["StaffSeed:Email"] ?? "staff@autoparts.com")
            .Trim()
            .ToLowerInvariant();
        var password = configuration["StaffSeed:Password"] ?? "password123";
        var fullName = configuration["StaffSeed:FullName"] ?? "Staff User";

        var user = await dbContext.Users
            .Include(item => item.Staff)
            .SingleOrDefaultAsync(item => item.Email == email);

        if (user is not null)
        {
            if (user.Staff is null)
            {
                dbContext.Staff.Add(new Staff
                {
                    UserId = user.Id,
                    StaffRole = StaffRole.SalesStaff,
                    JoinDate = DateOnly.FromDateTime(DateTime.UtcNow),
                    IsActive = true
                });

                await dbContext.SaveChangesAsync();
            }

            return;
        }

        user = new User
        {
            FullName = fullName,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.Staff,
            IsActive = true,
            Staff = new Staff
            {
                StaffRole = StaffRole.SalesStaff,
                JoinDate = DateOnly.FromDateTime(DateTime.UtcNow),
                IsActive = true
            }
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedAdminSettings(ApplicationDbContext dbContext)
    {
        var exists = await dbContext.AdminSettings.AnyAsync();

        if (exists)
        {
            return;
        }

        dbContext.AdminSettings.Add(new AdminSettings
        {
            CompanyName = "AutoParts",
            CompanyAddress = "Kathmandu, Nepal",
            CurrencySymbol = "$",
            LowStockThreshold = 10,
            LoyaltyDiscountThreshold = 5000m,
            LoyaltyDiscountPercentage = 10m
        });

        await dbContext.SaveChangesAsync();
    }
}
