using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Admin.Staff;

public sealed record AdminStaffDto(
    Guid Id,
    Guid UserId,
    string FullName,
    string Email,
    string Role,
    string? PhoneNumber,
    DateOnly JoinDate,
    bool IsActive);

public sealed record CreateAdminStaffRequestDto(
    [param: Required]
    [param: StringLength(200)]
    string FullName,

    [param: Required]
    [param: EmailAddress]
    [param: StringLength(255)]
    string Email,

    [param: Required]
    [param: MinLength(8)]
    [param: MaxLength(100)]
    string Password,

    [param: Required]
    [param: StringLength(30)]
    string Role,

    [param: StringLength(20)]
    string? PhoneNumber,

    [param: Required]
    DateOnly JoinDate);

public sealed record UpdateAdminStaffRequestDto(
    [param: Required]
    [param: StringLength(200)]
    string FullName,

    [param: Required]
    [param: StringLength(30)]
    string Role,

    [param: StringLength(20)]
    string? PhoneNumber,

    [param: Required]
    DateOnly JoinDate,

    bool IsActive,

    [param: MinLength(8)]
    [param: MaxLength(100)]
    string? Password);
