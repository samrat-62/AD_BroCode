using Backend.DTOs.Auth;

namespace Backend.DTOs.Staff;

public sealed record StaffDto(
    Guid Id,
    string Name,
    string Email,
    string Role,
    string? AvatarUrl);

public sealed record StaffSessionDto(
    string Token,
    Guid SessionId,
    StaffDto Staff);

public sealed record StaffLoginRequestDto(
    string Email,
    string Password)
{
    public LoginRequestDto ToLoginRequest()
    {
        return new LoginRequestDto(Email, Password);
    }
}
