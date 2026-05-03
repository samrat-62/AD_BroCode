using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/healthz")]
public sealed class HealthController : ControllerBase
{
    [HttpGet(Name = "HealthCheck")]
    public ActionResult<HealthStatus> Get()
    {
        return Ok(new HealthStatus("ok"));
    }
}

public sealed record HealthStatus(string Status);
