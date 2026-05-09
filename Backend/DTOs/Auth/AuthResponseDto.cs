namespace Backend.DTOs.Auth;

public sealed record AuthResponseDto(
    Guid Id,
    string FullName,
    string Email,
    string Role,
    bool IsActive,
    string Token,
    DateTimeOffset ExpiresAtUtc);
