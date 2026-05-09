using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.Data;
using Backend.DTOs.Auth;
using Backend.Models.Customers;
using Backend.Models.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace Backend.Services.Auth;

public sealed class AuthService : IAuthService
{
    private const int DefaultTokenExpiryMinutes = 60;

    private readonly ApplicationDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public AuthService(ApplicationDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    public async Task<AuthResult> SignUpAsync(SignUpRequestDto request, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);

        var emailExists = await _dbContext.Users
            .AnyAsync(user => user.Email == email, cancellationToken);

        if (emailExists)
        {
            return AuthResult.EmailAlreadyExists();
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Customer,
            IsActive = true
        };

        var customer = new Customer
        {
            User = user,
            Phone = request.Phone.Trim(),
            NotificationSettings = new CustomerNotificationSettings()
        };

        _dbContext.Users.Add(user);
        _dbContext.Customers.Add(customer);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return AuthResult.EmailAlreadyExists();
        }

        return AuthResult.Success(CreateAuthResponse(user));
    }

    public async Task<AuthResult> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);

        var user = await _dbContext.Users
            .SingleOrDefaultAsync(user => user.Email == email, cancellationToken);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return AuthResult.InvalidCredentials();
        }

        if (!user.IsActive)
        {
            return AuthResult.InactiveUser();
        }

        return AuthResult.Success(CreateAuthResponse(user));
    }

    private AuthResponseDto CreateAuthResponse(User user)
    {
        var expiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(GetTokenExpiryMinutes());
        var token = GenerateJwtToken(user, expiresAtUtc);

        return new AuthResponseDto(
            user.Id,
            user.FullName,
            user.Email,
            user.Role.ToString(),
            user.IsActive,
            token,
            expiresAtUtc);
    }

    private string GenerateJwtToken(User user, DateTimeOffset expiresAtUtc)
    {
        var key = GetRequiredJwtSetting("Key");
        var issuer = GetRequiredJwtSetting("Issuer");
        var audience = GetRequiredJwtSetting("Audience");

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expiresAtUtc.UtcDateTime,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private int GetTokenExpiryMinutes()
    {
        return int.TryParse(_configuration["Jwt:ExpiresInMinutes"], out var expiresInMinutes)
            ? expiresInMinutes
            : DefaultTokenExpiryMinutes;
    }

    private string GetRequiredJwtSetting(string key)
    {
        return _configuration[$"Jwt:{key}"]
            ?? throw new InvalidOperationException($"JWT setting 'Jwt:{key}' is not configured.");
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static bool IsUniqueViolation(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgresException
            && postgresException.SqlState == PostgresErrorCodes.UniqueViolation;
    }
}
