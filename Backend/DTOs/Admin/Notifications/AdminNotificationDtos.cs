namespace Backend.DTOs.Admin.Notifications;

public sealed record AdminNotificationsListResponseDto(
    IReadOnlyList<AdminNotificationDto> Data,
    int Total,
    int Page,
    int Limit,
    int TotalPages,
    int UnreadCount);

public sealed record AdminNotificationDto(
    Guid Id,
    string Type,
    string Message,
    bool IsRead,
    DateTimeOffset CreatedAt);
