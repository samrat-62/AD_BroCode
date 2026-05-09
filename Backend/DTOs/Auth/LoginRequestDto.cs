using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Auth;

public sealed record LoginRequestDto(
    [param: Required]
    [param: EmailAddress]
    [param: StringLength(255)]
    string Email,

    [param: Required]
    string Password);
