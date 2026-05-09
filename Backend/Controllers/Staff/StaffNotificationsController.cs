using Backend.Data;
using Backend.DTOs.Staff;
using Backend.Models.Notifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Staff;

public sealed class StaffNotificationsController : StaffControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public StaffNotificationsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<IReadOnlyList<StaffNotificationDto>>> ListNotifications(
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        var notifications = await _dbContext.UserNotifications
            .AsNoTracking()
            .Where(notification =>
                notification.Audience == NotificationAudience.Staff &&
                (notification.UserId == null || notification.UserId == userId))
            .OrderByDescending(notification => notification.CreatedAt)
            .Select(notification => new StaffNotificationDto(
                notification.Id,
                StaffDtoMapper.ToNotificationType(notification.Type),
                notification.Title,
                notification.Message,
                notification.IsRead,
                notification.CreatedAt,
                notification.Link))
            .ToListAsync(cancellationToken);

        return Ok(notifications);
    }

    [HttpPost("notifications/read-all")]
    public async Task<IActionResult> MarkAllNotificationsRead(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        await _dbContext.UserNotifications
            .Where(notification =>
                notification.Audience == NotificationAudience.Staff &&
                !notification.IsRead &&
                (notification.UserId == null || notification.UserId == userId))
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(notification => notification.IsRead, true),
                cancellationToken);

        return NoContent();
    }
}
