using Backend.Data;
using Backend.DTOs.Customer;
using Backend.Models.Notifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Customer;

[Route("api/notifications")]
public sealed class CustomerNotificationsController : CustomerControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public CustomerNotificationsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> ListNotifications(
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized();
        }

        var notifications = await _dbContext.UserNotifications
            .AsNoTracking()
            .Where(notification =>
                notification.Audience == NotificationAudience.Customer &&
                notification.UserId == userId.Value)
            .OrderByDescending(notification => notification.CreatedAt)
            .Select(notification => new NotificationDto(
                notification.Id,
                ToTypeString(notification.Type),
                notification.Title,
                notification.Message,
                notification.IsRead,
                notification.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(notifications);
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkNotificationRead(Guid id, CancellationToken cancellationToken)
    {
        var notification = await _dbContext.UserNotifications
            .SingleOrDefaultAsync(
                item =>
                    item.Id == id &&
                    item.UserId == CurrentUserId &&
                    item.Audience == NotificationAudience.Customer,
                cancellationToken);

        if (notification is null)
        {
            return NotFound(new { message = "Notification was not found." });
        }

        notification.IsRead = true;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static string ToTypeString(UserNotificationType type)
    {
        return type switch
        {
            UserNotificationType.Appointment => "appointment",
            UserNotificationType.Order => "order",
            UserNotificationType.Ai => "ai",
            UserNotificationType.Promo => "promo",
            _ => "system"
        };
    }
}
