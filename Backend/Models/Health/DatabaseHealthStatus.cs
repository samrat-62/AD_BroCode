namespace Backend.Models.Health;

public sealed record DatabaseHealthStatus(
    string Status,
    string Database,
    bool CanConnect,
    DateTimeOffset CheckedAtUtc,
    DateTimeOffset StartedAtUtc);
