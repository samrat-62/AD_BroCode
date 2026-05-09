namespace Backend.Services.Application;

public interface IApplicationInfoService
{
    DateTimeOffset StartedAtUtc { get; }
}
