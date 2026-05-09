using Backend.DTOs.Health;
using Backend.Services.Health;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/healthz")]
public sealed class HealthController : ControllerBase
{
    private readonly IHealthService _healthService;

    public HealthController(IHealthService healthService)
    {
        _healthService = healthService;
    }

    [HttpGet(Name = "HealthCheck")]
    public ActionResult<HealthStatusDto> Get()
    {
        var healthStatus = _healthService.GetStatus();

        return Ok(new HealthStatusDto(healthStatus.Status));
    }

    [HttpGet("database", Name = "DatabaseHealthCheck")]
    public async Task<ActionResult<DatabaseHealthStatusDto>> GetDatabase(CancellationToken cancellationToken)
    {
        var databaseStatus = await _healthService.GetDatabaseStatusAsync(cancellationToken);
        var response = new DatabaseHealthStatusDto(
            databaseStatus.Status,
            databaseStatus.Database,
            databaseStatus.CanConnect);

        if (!databaseStatus.CanConnect)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
        }

        return Ok(response);
    }
}
