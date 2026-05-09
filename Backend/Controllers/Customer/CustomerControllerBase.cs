using System.Security.Claims;
using Backend.Data;
using Backend.Models.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Customer;

[Authorize(Roles = "Customer")]
[ApiController]
public abstract class CustomerControllerBase : ControllerBase
{
    protected Guid? CurrentUserId
    {
        get
        {
            var rawUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(rawUserId, out var userId) ? userId : null;
        }
    }

    protected async Task<Backend.Models.Users.Customer?> GetCurrentCustomerAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (CurrentUserId is not { } userId)
        {
            return null;
        }

        return await dbContext.Customers
            .Include(customer => customer.User)
            .SingleOrDefaultAsync(customer => customer.UserId == userId, cancellationToken);
    }

    protected static string NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
    }

    protected static string? NormalizeOptionalNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
