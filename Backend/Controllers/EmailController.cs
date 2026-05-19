using Backend.DTOs.Email;
using Backend.Services.Email;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Backend.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Staff")]
[Route("api/email")]
public sealed class EmailController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailController> _logger;

    public EmailController(IEmailService emailService, ILogger<EmailController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("send")]
    public async Task<ActionResult<EmailSendResponseDto>> SendEmail(
        SendEmailRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _emailService.SendEmailAsync(
                new EmailMessage(request.To, request.Subject, request.Body, request.IsHtml),
                cancellationToken);
        }
        catch (Exception exception) when (IsEmailFailure(exception))
        {
            _logger.LogError(exception, "Email send request failed.");
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = "Email could not be sent. Check SMTP configuration." });
        }

        return Ok(new EmailSendResponseDto(request.To, DateTimeOffset.UtcNow));
    }

    private static bool IsEmailFailure(Exception exception)
    {
        return exception is EmailSendException
            or InvalidOperationException
            or ArgumentException
            or OptionsValidationException;
    }
}
