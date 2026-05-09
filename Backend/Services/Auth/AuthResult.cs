using Backend.DTOs.Auth;

namespace Backend.Services.Auth;

public sealed record AuthResult(AuthResultStatus Status, AuthResponseDto? Response = null)
{
    public bool Succeeded => Status == AuthResultStatus.Success;

    public static AuthResult Success(AuthResponseDto response)
    {
        return new AuthResult(AuthResultStatus.Success, response);
    }

    public static AuthResult EmailAlreadyExists()
    {
        return new AuthResult(AuthResultStatus.EmailAlreadyExists);
    }

    public static AuthResult InvalidCredentials()
    {
        return new AuthResult(AuthResultStatus.InvalidCredentials);
    }

    public static AuthResult InactiveUser()
    {
        return new AuthResult(AuthResultStatus.InactiveUser);
    }
}
