using Backend.DTOs.Auth;
using Backend.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.Auth;

[ApiController]
[AllowAnonymous]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("signup")]
    public async Task<ActionResult<AuthResponseDto>> SignUp(
        SignUpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.SignUpAsync(request, cancellationToken);

        return result.Status switch
        {
            AuthResultStatus.Success => StatusCode(StatusCodes.Status201Created, result.Response),
            AuthResultStatus.EmailAlreadyExists => Conflict(new { message = "Email is already registered." }),
            _ => BadRequest(new { message = "Unable to sign up." })
        };
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(
        LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);

        return result.Status switch
        {
            AuthResultStatus.Success => Ok(result.Response),
            AuthResultStatus.InvalidCredentials => Unauthorized(new { message = "Invalid email or password." }),
            AuthResultStatus.InactiveUser => StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = "Account is inactive." }),
            _ => BadRequest(new { message = "Unable to log in." })
        };
    }
}
