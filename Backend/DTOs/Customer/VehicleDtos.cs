using System.ComponentModel.DataAnnotations;
namespace Backend.DTOs.Customer;

public sealed record VehicleDto(
    Guid Id,
    string Make,
    string Model,
    int Year,
    string Plate,
    string? Color,
    int? EngineCC,
    string? FuelType,
    string? PhotoUrl,
    string Status);

public sealed record VehicleInputDto(
    [param: Required]
    [param: StringLength(120)]
    string Make,

    [param: Required]
    [param: StringLength(120)]
    string Model,

    [param: Range(1900, 2100)]
    int Year,

    [param: Required]
    [param: StringLength(40)]
    string Plate,

    [param: StringLength(80)]
    string? Color,

    int? EngineCC,

    string? FuelType,

    [param: StringLength(500)]
    string? PhotoUrl,

    string? Status);
