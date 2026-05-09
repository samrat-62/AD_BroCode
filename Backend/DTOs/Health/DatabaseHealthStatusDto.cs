namespace Backend.DTOs.Health;

public sealed record DatabaseHealthStatusDto(
    string Status,
    string Database,
    bool CanConnect);
