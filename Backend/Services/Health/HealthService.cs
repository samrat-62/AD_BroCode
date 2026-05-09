using Backend.Data;
using Backend.Models.Health;
using Backend.Services.Application;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Health;

public sealed class HealthService : IHealthService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IApplicationInfoService _applicationInfoService;
    private readonly ILogger<HealthService> _logger;

    public HealthService(
        ApplicationDbContext dbContext,
        IApplicationInfoService applicationInfoService,
        ILogger<HealthService> logger)
    {
        _dbContext = dbContext;
        _applicationInfoService = applicationInfoService;
        _logger = logger;
    }

    public HealthStatus GetStatus()
    {
        return new HealthStatus(
            Status: "ok",
            CheckedAtUtc: DateTimeOffset.UtcNow,
            StartedAtUtc: _applicationInfoService.StartedAtUtc);
    }

    public async Task<DatabaseHealthStatus> GetDatabaseStatusAsync(CancellationToken cancellationToken)
    {
        var canConnect = await CanConnectToDatabaseAsync(cancellationToken);

        return new DatabaseHealthStatus(
            Status: canConnect ? "ok" : "database-unavailable",
            Database: "PostgreSQL",
            CanConnect: canConnect,
            CheckedAtUtc: DateTimeOffset.UtcNow,
            StartedAtUtc: _applicationInfoService.StartedAtUtc);
    }

    private async Task<bool> CanConnectToDatabaseAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await _dbContext.Database.CanConnectAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Database health check failed.");

            return false;
        }
    }
}
