using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Customer;

public sealed record OrderDto(
    Guid Id,
    decimal Total,
    decimal Subtotal,
    decimal Discount,
    string Status,
    string DeliveryType,
    string PaymentMethod,
    DateTimeOffset CreatedAt,
    IReadOnlyList<OrderItemDto> Items);

public sealed record OrderItemDto(
    Guid Id,
    Guid PartId,
    string PartName,
    int Quantity,
    decimal UnitPrice);

public sealed record OrderInputDto(
    [param: Required]
    [param: MinLength(1)]
    IReadOnlyList<OrderInputItemDto> Items,

    [param: Required]
    string DeliveryType,

    [param: Required]
    string PaymentMethod,

    string? DeliveryAddress);

public sealed record OrderInputItemDto(
    Guid PartId,

    [param: Range(1, int.MaxValue)]
    int Quantity);
