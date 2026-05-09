using Backend.DTOs.Auth;

namespace Backend.Services.Auth;

public interface IAuthService
{
    Task<AuthResult> SignUpAsync(SignUpRequestDto request, CancellationToken cancellationToken);

    Task<AuthResult> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken);
}
