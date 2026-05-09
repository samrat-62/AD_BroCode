using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Staff;

public sealed record StaffCustomerDto(
    Guid Id,
    string FullName,
    string Phone,
    string? Email,
    string? Nid,
    DateOnly? Dob,
    string? Address,
    decimal CreditLimit,
    decimal CreditBalance,
    decimal TotalSpend,
    int VehiclesCount,
    int VisitCount,
    DateTimeOffset? LastVisit,
    DateTimeOffset MemberSince,
    bool Regular);

public sealed record StaffCustomerProfileDto(
    StaffCustomerDto Customer,
    decimal TotalSpend,
    DateTimeOffset MemberSince);

public sealed record CreateStaffCustomerRequestDto(
    [param: Required]
    [param: StringLength(200)]
    string FullName,

    [param: Required]
    [param: StringLength(20)]
    string Phone,

    [param: EmailAddress]
    [param: StringLength(255)]
    string? Email,

    [param: StringLength(50)]
    string? Nid,

    DateOnly? Dob,

    string? Address,

    decimal? CreditLimit,

    string? Notes,

    IReadOnlyList<CreateStaffVehicleRequestDto>? Vehicles);

public sealed record CreateStaffVehicleRequestDto(
    [param: Required]
    string Make,
    [param: Required]
    string Model,
    int Year,
    [param: Required]
    string Plate,
    string? Color,
    string? FuelType,
    int? EngineCc);

public sealed record StaffVehicleDto(
    Guid Id,
    Guid CustomerId,
    string Make,
    string Model,
    int Year,
    string Plate,
    string? Color,
    string? FuelType,
    int? EngineCc);

public sealed record StaffCustomerNoteDto(
    Guid Id,
    Guid CustomerId,
    string Body,
    string Author,
    DateTimeOffset CreatedAt);

public sealed record AddStaffCustomerNoteRequestDto(
    [param: Required]
    string Body);

public sealed record StaffServiceRecordDto(
    Guid Id,
    Guid CustomerId,
    DateTimeOffset Date,
    string ServiceType,
    string Technician,
    decimal Cost);

public sealed record StaffCreditTransactionDto(
    Guid Id,
    Guid CustomerId,
    DateTimeOffset Date,
    string Type,
    string? Notes,
    Guid? InvoiceId,
    decimal Amount,
    decimal BalanceAfter);
