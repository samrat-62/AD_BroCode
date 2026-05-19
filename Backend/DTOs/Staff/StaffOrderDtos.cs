using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Staff;

public sealed record StaffCustomerOrderDto(
    Guid Id,
    string OrderNumber,
    Guid CustomerId,
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    string Status,
    string DeliveryType,
    string PaymentMethod,
    string? DeliveryAddress,
    decimal Subtotal,
    decimal Discount,
    decimal Total,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<StaffCustomerOrderItemDto> Items);

public sealed record StaffCustomerOrderItemDto(
    Guid Id,
    Guid PartId,
    string PartName,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal);

public sealed record UpdateStaffCustomerOrderStatusDto(
    [param: Required]
    string Status);

public sealed record StaffCustomerPurchaseDto(
    Guid Id,
    string Source,
    string ReferenceNumber,
    string Status,
    string PaymentMethod,
    decimal Total,
    DateTimeOffset CreatedAt,
    string? StaffName,
    string? VehiclePlate);
