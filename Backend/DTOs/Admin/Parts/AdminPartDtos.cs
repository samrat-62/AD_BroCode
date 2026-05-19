using System.ComponentModel.DataAnnotations;
using Backend.DTOs.Admin.Common;

namespace Backend.DTOs.Admin.Parts;

public sealed record AdminPartCategoryDto(Guid Id, string Name);

public sealed record AdminPartDto(
    Guid Id,
    string Name,
    string? PartNumber,
    Guid CategoryId,
    string CategoryName,
    string? Description,
    decimal UnitPrice,
    int StockQuantity,
    int ReorderLevel,
    Guid? VendorId,
    string? VendorName);

public sealed record AdminLowStockPartDto(
    Guid PartId,
    string PartName,
    string Category,
    int CurrentStock,
    int ReorderLevel,
    string? VendorName);

public sealed record AdminPartsListResponseDto(
    IReadOnlyList<AdminPartDto> Data,
    int Total,
    int Page,
    int Limit,
    int TotalPages,
    int LowStockCount);

public sealed record CreatePartCategoryRequestDto(
    [param: Required]
    [param: StringLength(120)]
    string Name);

public sealed record UpsertAdminPartRequestDto(
    [param: Required]
    [param: StringLength(200)]
    string Name,

    [param: StringLength(100)]
    string? PartNumber,

    [param: Required]
    Guid CategoryId,

    string? Description,

    [param: Range(0.01, double.MaxValue)]
    decimal UnitPrice,

    [param: Range(0, int.MaxValue)]
    int StockQuantity,

    [param: Range(0, int.MaxValue)]
    int ReorderLevel,

    [param: Required]
    Guid VendorId);
