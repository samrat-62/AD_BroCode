namespace Backend.Services.Application;

public sealed class ApplicationInfoService : IApplicationInfoService
{
    public DateTimeOffset StartedAtUtc { get; } = DateTimeOffset.UtcNow;
}
