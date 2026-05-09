namespace Backend.DTOs.Admin.Common;

public sealed record PagedResponseDto<T>(
    IReadOnlyList<T> Data,
    int Total,
    int Page,
    int Limit,
    int TotalPages);
