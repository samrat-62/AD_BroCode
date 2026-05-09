namespace Backend.Services.Auth;

public enum AuthResultStatus
{
    Success,
    EmailAlreadyExists,
    InvalidCredentials,
    InactiveUser
}
