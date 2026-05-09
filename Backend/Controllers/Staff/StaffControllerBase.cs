using System.Security.Claims;
using Backend.Data;
using Backend.Models.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Staff;

[Authorize(Roles = "Admin,Staff")]
[ApiController]
[Route("api/staff")]
public abstract class StaffControllerBase : ControllerBase
{
    protected Guid? CurrentUserId
    {
        get
        {
            var rawUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(rawUserId, out var userId) ? userId : null;
        }
    }

    protected async Task<Backend.Models.Users.Staff?> GetCurrentStaffAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (CurrentUserId is not { } userId)
        {
            return null;
        }

        return await dbContext.Staff
            .Include(staff => staff.User)
            .SingleOrDefaultAsync(staff => staff.UserId == userId && staff.IsActive, cancellationToken);
    }

    protected static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
