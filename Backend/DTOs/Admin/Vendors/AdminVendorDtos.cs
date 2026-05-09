using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Admin.Vendors;

public sealed record AdminVendorDto(
    Guid Id,
    string Name,
    string? ContactPerson,
    string? Phone,
    string? Email,
    string? Address,
    string? Notes,
    int PartsCount);

public sealed record AdminVendorDetailDto(
    Guid Id,
    string Name,
    string? ContactPerson,
    string? Phone,
    string? Email,
    string? Address,
    string? Notes,
    int PartsSuppliedCount,
    decimal TotalPurchaseValue,
    IReadOnlyList<AdminVendorPartDto> Parts,
    IReadOnlyList<AdminVendorPurchaseInvoiceDto> PurchaseInvoices);

public sealed record AdminVendorPartDto(
    Guid Id,
    string Name,
    string? PartNumber,
    int StockQuantity,
    int ReorderLevel,
    decimal UnitPrice);

public sealed record AdminVendorPurchaseInvoiceDto(
    Guid Id,
    string InvoiceNumber,
    decimal TotalCost,
    DateTimeOffset CreatedAt);

public sealed record UpsertAdminVendorRequestDto(
    [param: Required]
    [param: StringLength(200)]
    string Name,

    [param: StringLength(200)]
    string? ContactPerson,

    [param: StringLength(20)]
    string? Phone,

    [param: EmailAddress]
    [param: StringLength(255)]
    string? Email,

    string? Address,

    string? Notes);
