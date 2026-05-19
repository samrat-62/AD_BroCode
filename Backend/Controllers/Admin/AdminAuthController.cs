using Backend.DTOs.Auth;
using Backend.Models.Users;
using Backend.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.Admin;

[ApiController]
[AllowAnonymous]
[Route("api/admin/auth")]
public sealed class AdminAuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AdminAuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(
        LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);

        if (result.Status == AuthResultStatus.InvalidCredentials)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (result.Status == AuthResultStatus.InactiveUser)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Account is inactive." });
        }

        if (result.Response is null)
        {
            return BadRequest(new { message = "Unable to log in." });
        }

        if (result.Response.Role != UserRole.Admin.ToString())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Admin access is required." });
        }

        return Ok(result.Response);
    }
}
