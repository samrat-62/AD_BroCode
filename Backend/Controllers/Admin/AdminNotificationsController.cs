using Backend.Data;
using Backend.DTOs.Admin.Notifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Admin;

public sealed class AdminNotificationsController : AdminControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public AdminNotificationsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<AdminNotificationsListResponseDto>> ListNotifications(
        [FromQuery] bool? isRead,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        limit = Math.Clamp(limit, 1, 200);

        var query = _dbContext.AdminNotifications.AsNoTracking();

        if (isRead.HasValue)
        {
            query = query.Where(notification => notification.IsRead == isRead.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var unreadCount = await _dbContext.AdminNotifications
            .CountAsync(notification => !notification.IsRead, cancellationToken);
        var data = await query
            .OrderByDescending(notification => notification.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(notification => new AdminNotificationDto(
                notification.Id,
                notification.Type,
                notification.Message,
                notification.IsRead,
                notification.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new AdminNotificationsListResponseDto(
            data,
            total,
            page,
            limit,
            ToTotalPages(total, limit),
            unreadCount));
    }

    [HttpPost("notifications/{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken cancellationToken)
    {
        var notification = await _dbContext.AdminNotifications
            .SingleOrDefaultAsync(notification => notification.Id == id, cancellationToken);

        if (notification is null)
        {
            return NotFound(new { message = "Notification was not found." });
        }

        notification.IsRead = true;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPost("notifications/read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        await _dbContext.AdminNotifications
            .Where(notification => !notification.IsRead)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(notification => notification.IsRead, true),
                cancellationToken);

        return NoContent();
    }

    private static int ToTotalPages(int total, int limit)
    {
        return Math.Max(1, (int)Math.Ceiling(total / (double)limit));
    }
}
