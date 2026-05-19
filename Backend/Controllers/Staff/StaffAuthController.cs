using Backend.Data;
using Backend.DTOs.Staff;
using Backend.Models.Users;
using Backend.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Staff;

[AllowAnonymous]
[ApiController]
[Route("api/staff/auth")]
public sealed class StaffAuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ApplicationDbContext _dbContext;

    public StaffAuthController(IAuthService authService, ApplicationDbContext dbContext)
    {
        _authService = authService;
        _dbContext = dbContext;
    }

    [HttpPost("login")]
    public async Task<ActionResult<StaffSessionDto>> Login(
        StaffLoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request.ToLoginRequest(), cancellationToken);

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

        if (result.Response.Role == UserRole.Customer.ToString())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Staff access is required." });
        }

        if (result.Response.Role == UserRole.Admin.ToString())
        {
            return Ok(new StaffSessionDto(
                result.Response.Token,
                result.Response.SessionId,
                new StaffDto(
                    result.Response.Id,
                    result.Response.FullName,
                    result.Response.Email,
                    "Admin",
                    null)));
        }

        var staff = await _dbContext.Staff
            .Include(item => item.User)
            .SingleOrDefaultAsync(
                item => item.UserId == result.Response.Id && item.IsActive,
                cancellationToken);

        if (staff is null)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Staff account is inactive." });
        }

        return Ok(new StaffSessionDto(
            result.Response.Token,
            result.Response.SessionId,
            StaffDtoMapper.ToStaffDto(staff)));
    }
}
