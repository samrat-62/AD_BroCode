namespace Backend.Models.Health;

public sealed record HealthStatus(
    string Status,
    DateTimeOffset CheckedAtUtc,
    DateTimeOffset StartedAtUtc);
