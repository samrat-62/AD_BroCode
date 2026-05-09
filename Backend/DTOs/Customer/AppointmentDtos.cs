using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Customer;

public sealed record AppointmentDto(
    Guid Id,
    Guid VehicleId,
    string VehicleLabel,
    string ServiceType,
    DateTimeOffset ScheduledAt,
    string Status,
    string? Notes,
    string? Technician,
    decimal? Cost,
    bool HasReview);

public sealed record AppointmentInputDto(
    [param: Required]
    Guid VehicleId,

    [param: Required]
    [param: StringLength(120)]
    string ServiceType,

    DateTimeOffset ScheduledAt,

    string? Notes,

    string? Status);
