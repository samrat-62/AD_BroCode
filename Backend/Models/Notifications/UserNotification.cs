using Backend.Models.Users;

namespace Backend.Models.Notifications;

public sealed class UserNotification
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public NotificationAudience Audience { get; set; } = NotificationAudience.Customer;

    public UserNotificationType Type { get; set; } = UserNotificationType.System;

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public string? Link { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
}
