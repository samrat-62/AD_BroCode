using Backend.Models.Health;

namespace Backend.Services.Health;

public interface IHealthService
{
    HealthStatus GetStatus();

    Task<DatabaseHealthStatus> GetDatabaseStatusAsync(CancellationToken cancellationToken);
}
