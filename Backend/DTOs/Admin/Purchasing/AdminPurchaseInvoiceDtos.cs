using System.ComponentModel.DataAnnotations;
using Backend.DTOs.Admin.Common;

namespace Backend.DTOs.Admin.Purchasing;

public sealed record AdminPurchaseInvoiceListResponseDto(
    IReadOnlyList<AdminPurchaseInvoiceListItemDto> Data,
    int Total,
    int Page,
    int Limit,
    int TotalPages,
    decimal TotalValue);

public sealed record AdminPurchaseInvoiceListItemDto(
    Guid Id,
    string InvoiceNumber,
    Guid VendorId,
    string VendorName,
    int ItemsCount,
    decimal TotalCost,
    DateTimeOffset CreatedAt);

public sealed record AdminPurchaseInvoiceDetailDto(
    Guid Id,
    string InvoiceNumber,
    Guid VendorId,
    string VendorName,
    string? VendorPhone,
    decimal TotalCost,
    int ItemsCount,
    DateTimeOffset CreatedAt,
    string? CreatedByName,
    string? Notes,
    IReadOnlyList<AdminPurchaseInvoiceLineItemDto> LineItems);

public sealed record AdminPurchaseInvoiceLineItemDto(
    Guid PartId,
    string PartName,
    int Quantity,
    decimal UnitCost,
    decimal Subtotal,
    int StockBefore,
    int StockAfter);

public sealed record CreatePurchaseInvoiceRequestDto(
    [param: Required]
    Guid VendorId,

    [param: Required]
    [param: MinLength(1)]
    IReadOnlyList<CreatePurchaseInvoiceLineItemRequestDto> LineItems,

    string? Notes);

public sealed record CreatePurchaseInvoiceLineItemRequestDto(
    [param: Required]
    Guid PartId,

    [param: Range(1, int.MaxValue)]
    int Quantity,

    [param: Range(0.01, double.MaxValue)]
    decimal UnitCost);
