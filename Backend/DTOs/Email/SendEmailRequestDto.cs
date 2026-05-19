using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Email;

public sealed record SendEmailRequestDto(
    [param: Required]
    [param: EmailAddress]
    string To,

    [param: Required]
    [param: StringLength(200)]
    string Subject,

    [param: Required]
    string Body,

    bool IsHtml = false);

public sealed record EmailSendResponseDto(
    string SentTo,
    DateTimeOffset SentAt);
