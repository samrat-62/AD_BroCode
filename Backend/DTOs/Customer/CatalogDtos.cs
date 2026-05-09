namespace Backend.DTOs.Customer;

public sealed record PartDto(
    Guid Id,
    string Name,
    string Category,
    decimal Price,
    int StockQty,
    string? Description,
    string? ImageUrl,
    string? PartNumber,
    IReadOnlyList<string> CompatibleModels,
    int Popularity,
    DateTimeOffset CreatedAt);

public sealed record PartCategoryDto(
    string Name,
    int Count);
