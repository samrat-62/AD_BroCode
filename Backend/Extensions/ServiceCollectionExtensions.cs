using Backend.Data;
using Backend.Services.Auth;
using Backend.Services.Application;
using Backend.Services.Email;
using Backend.Services.Health;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

namespace Backend.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
        });

        services.AddHttpContextAccessor();
        AddJwtAuthentication(services, configuration);

        services
            .AddOptions<EmailSettings>()
            .Bind(configuration.GetSection(EmailSettings.SectionName))
            .Validate(settings => settings.IsValidForSending(), "EmailSettings is incomplete.");

        services.AddSingleton<IApplicationInfoService, ApplicationInfoService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IHealthService, HealthService>();

        return services;
    }

    private static void AddJwtAuthentication(IServiceCollection services, IConfiguration configuration)
    {
        var key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT setting 'Jwt:Key' is not configured.");
        var issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("JWT setting 'Jwt:Issuer' is not configured.");
        var audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("JWT setting 'Jwt:Audience' is not configured.");

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                };

                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async context =>
                    {
                        var rawUserId = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                        var rawSessionId = context.Principal?.FindFirst("sid")?.Value;

                        if (!Guid.TryParse(rawUserId, out var userId) ||
                            !Guid.TryParse(rawSessionId, out var sessionId))
                        {
                            context.Fail("Token session is missing.");
                            return;
                        }

                        var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                        var now = DateTimeOffset.UtcNow;
                        var sessionIsActive = await dbContext.UserSessions
                            .AsNoTracking()
                            .AnyAsync(
                                session =>
                                    session.Id == sessionId &&
                                    session.UserId == userId &&
                                    session.RevokedAt == null &&
                                    session.ExpiresAtUtc > now,
                                context.HttpContext.RequestAborted);

                        if (!sessionIsActive)
                        {
                            context.Fail("Session is inactive or expired.");
                        }
                    }
                };
            });

        services.AddAuthorization();
    }
}
