using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Customer;

public sealed record PartRequestDto(
    Guid Id,
    string PartName,
    string? PartNumber,
    Guid? VehicleId,
    string? VehicleLabel,
    string? Description,
    string? ImageUrl,
    string Status,
    DateTimeOffset CreatedAt);

public sealed record PartRequestInputDto(
    [param: Required]
    [param: StringLength(200)]
    string PartName,

    [param: StringLength(100)]
    string? PartNumber,

    Guid? VehicleId,

    string? Description,

    [param: StringLength(500)]
    string? ImageUrl);

public sealed record ReviewDto(
    Guid Id,
    Guid? AppointmentId,
    string? AppointmentLabel,
    int Rating,
    string? Title,
    string Body,
    string Status,
    DateTimeOffset CreatedAt);

public sealed record ReviewInputDto(
    Guid? AppointmentId,

    [param: Range(1, 5)]
    int Rating,

    [param: StringLength(160)]
    string? Title,

    [param: Required]
    string Body);

public sealed record NotificationDto(
    Guid Id,
    string Type,
    string Title,
    string Message,
    bool Read,
    DateTimeOffset CreatedAt);
