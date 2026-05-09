using Backend.Data;
using Backend.DTOs.Admin.Common;
using Backend.DTOs.Admin.Staff;
using Backend.Models.Users;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.Controllers.Admin;

public sealed class AdminStaffController : AdminControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public AdminStaffController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("staff")]
    public async Task<ActionResult<PagedResponseDto<AdminStaffDto>>> ListStaff(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 15,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        limit = Math.Clamp(limit, 1, 200);

        var query = _dbContext.Staff
            .Include(staff => staff.User)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(staff =>
                staff.User.FullName.ToLower().Contains(term)
                || staff.User.Email.ToLower().Contains(term)
                || (staff.PhoneNumber != null && staff.PhoneNumber.Contains(term)));
        }

        var total = await query.CountAsync(cancellationToken);
        var data = await query
            .OrderBy(staff => staff.User.FullName)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(staff => ToDto(staff))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResponseDto<AdminStaffDto>(
            data,
            total,
            page,
            limit,
            ToTotalPages(total, limit)));
    }

    [HttpPost("staff")]
    public async Task<ActionResult<AdminStaffDto>> CreateStaff(
        CreateAdminStaffRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryParseStaffRole(request.Role, out var staffRole))
        {
            return BadRequest(new { message = "Role must be 'sales_staff' or 'manager'." });
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Staff,
            IsActive = true
        };

        var staff = new Backend.Models.Users.Staff
        {
            User = user,
            StaffRole = staffRole,
            PhoneNumber = NormalizeOptional(request.PhoneNumber),
            JoinDate = request.JoinDate,
            IsActive = true
        };

        _dbContext.Users.Add(user);
        _dbContext.Staff.Add(staff);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return Conflict(new { message = "Email is already registered." });
        }

        return CreatedAtAction(nameof(ListStaff), new { id = staff.Id }, ToDto(staff));
    }

    [HttpPut("staff/{id:guid}")]
    public async Task<ActionResult<AdminStaffDto>> UpdateStaff(
        Guid id,
        UpdateAdminStaffRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryParseStaffRole(request.Role, out var staffRole))
        {
            return BadRequest(new { message = "Role must be 'sales_staff' or 'manager'." });
        }

        var staff = await _dbContext.Staff
            .Include(staff => staff.User)
            .SingleOrDefaultAsync(staff => staff.Id == id, cancellationToken);

        if (staff is null)
        {
            return NotFound(new { message = "Staff member was not found." });
        }

        staff.User.FullName = request.FullName.Trim();
        staff.User.IsActive = request.IsActive;
        staff.StaffRole = staffRole;
        staff.PhoneNumber = NormalizeOptional(request.PhoneNumber);
        staff.JoinDate = request.JoinDate;
        staff.IsActive = request.IsActive;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            staff.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(staff));
    }

    [HttpDelete("staff/{id:guid}")]
    public async Task<IActionResult> DeleteStaff(Guid id, CancellationToken cancellationToken)
    {
        var staff = await _dbContext.Staff
            .Include(staff => staff.User)
            .SingleOrDefaultAsync(staff => staff.Id == id, cancellationToken);

        if (staff is null)
        {
            return NotFound(new { message = "Staff member was not found." });
        }

        _dbContext.Users.Remove(staff.User);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static AdminStaffDto ToDto(Backend.Models.Users.Staff staff)
    {
        return new AdminStaffDto(
            staff.Id,
            staff.UserId,
            staff.User.FullName,
            staff.User.Email,
            ToApiRole(staff.StaffRole),
            staff.PhoneNumber,
            staff.JoinDate,
            staff.IsActive && staff.User.IsActive);
    }

    private static bool TryParseStaffRole(string value, out StaffRole role)
    {
        switch (value.Trim().ToLowerInvariant().Replace("-", "_"))
        {
            case "sales_staff":
            case "salesstaff":
                role = StaffRole.SalesStaff;
                return true;
            case "manager":
                role = StaffRole.Manager;
                return true;
            default:
                role = StaffRole.SalesStaff;
                return false;
        }
    }

    private static string ToApiRole(StaffRole role)
    {
        return role == StaffRole.Manager ? "manager" : "sales_staff";
    }

    private static int ToTotalPages(int total, int limit)
    {
        return Math.Max(1, (int)Math.Ceiling(total / (double)limit));
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static bool IsUniqueViolation(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgresException
            && postgresException.SqlState == PostgresErrorCodes.UniqueViolation;
    }
}
