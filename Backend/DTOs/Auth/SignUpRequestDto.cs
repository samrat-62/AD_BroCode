using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Auth;

public sealed record SignUpRequestDto(
    [param: Required]
    [param: StringLength(200)]
    string FullName,

    [param: Required]
    [param: EmailAddress]
    [param: StringLength(255)]
    string Email,

    [param: Required]
    [param: StringLength(20)]
    string Phone,

    [param: Required]
    [param: MinLength(8)]
    [param: MaxLength(100)]
    string Password);
