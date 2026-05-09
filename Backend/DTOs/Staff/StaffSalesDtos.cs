using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Staff;

public sealed record StaffPartDto(
    Guid Id,
    string PartNumber,
    string Name,
    decimal UnitPrice,
    int Stock,
    int ReorderLevel);

public sealed record StaffInvoiceDto(
    Guid Id,
    string InvoiceNumber,
    Guid? CustomerId,
    string? WalkInName,
    Guid? VehicleId,
    string StaffName,
    DateTimeOffset CreatedAt,
    string Status,
    string PaymentMethod,
    decimal Subtotal,
    decimal Discount,
    decimal Total,
    string? Notes);

public sealed record StaffInvoiceSummaryDto(
    Guid Id,
    string InvoiceNumber,
    Guid? CustomerId,
    string? WalkInName,
    Guid? VehicleId,
    string StaffName,
    DateTimeOffset CreatedAt,
    string Status,
    string PaymentMethod,
    decimal Subtotal,
    decimal Discount,
    decimal Total,
    string? Notes,
    string CustomerName,
    string? VehiclePlate);

public sealed record StaffInvoiceItemDto(
    Guid Id,
    Guid PartId,
    string PartNumber,
    string Name,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal);

public sealed record StaffInvoiceDetailDto(
    StaffInvoiceDto Invoice,
    IReadOnlyList<StaffInvoiceItemDto> Items,
    StaffCustomerDto? Customer,
    StaffVehicleDto? Vehicle,
    string StaffName,
    string? Notes);

public sealed record CreateStaffSaleRequestDto(
    Guid? CustomerId,
    string? WalkInName,
    Guid? VehicleId,
    [param: Required]
    IReadOnlyList<CreateStaffSaleItemRequestDto> Items,
    [param: Required]
    string PaymentMethod,
    bool AddToCredit,
    string? Notes);

public sealed record CreateStaffSaleItemRequestDto(
    Guid PartId,
    [param: Range(1, int.MaxValue)]
    int Quantity);

public sealed record SendStaffInvoiceEmailRequestDto(
    string To,
    string? Subject,
    string? Message);

public sealed record StaffActionResultDto(
    Guid Id,
    object? SentTo,
    DateTimeOffset SentAt);
