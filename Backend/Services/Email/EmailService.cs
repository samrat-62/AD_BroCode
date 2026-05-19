using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Backend.Services.Email;

public sealed class EmailService : IEmailService
{
    private readonly IOptionsMonitor<EmailSettings> _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptionsMonitor<EmailSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings;
        _logger = logger;
    }

    public async Task SendEmailAsync(
        EmailMessage message,
        CancellationToken cancellationToken = default)
    {
        ValidateMessage(message);

        var settings = _settings.CurrentValue;
        ValidateSettings(settings);

        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(new MailboxAddress(
            settings.SenderName.Trim(),
            settings.SenderEmail.Trim()));
        mimeMessage.To.Add(MailboxAddress.Parse(message.To.Trim()));
        mimeMessage.Subject = message.Subject.Trim();

        var bodyBuilder = new BodyBuilder();
        if (message.IsHtml)
        {
            bodyBuilder.HtmlBody = message.Body;
        }
        else
        {
            bodyBuilder.TextBody = message.Body;
        }

        mimeMessage.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var smtpClient = new SmtpClient
            {
                Timeout = settings.TimeoutSeconds * 1000
            };

            await smtpClient.ConnectAsync(
                settings.SmtpHost.Trim(),
                settings.SmtpPort,
                GetSecureSocketOptions(settings.SmtpPort),
                cancellationToken);

            await smtpClient.AuthenticateAsync(
                settings.UserName.Trim(),
                settings.Password,
                cancellationToken);

            await smtpClient.SendAsync(mimeMessage, cancellationToken);
            await smtpClient.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation(
                "Email sent to {Recipient} with subject {Subject}.",
                message.To,
                message.Subject);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            throw new EmailSendException(
                "Email could not be sent. Check SMTP settings, credentials, and provider security requirements.",
                exception);
        }
    }

    public Task SendLowStockAlertAsync(
        LowStockAlertEmail alert,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(alert.PartName))
        {
            throw new ArgumentException("Part name is required.", nameof(alert));
        }

        var settings = _settings.CurrentValue;
        var subject = $"Low stock alert: {alert.PartName.Trim()}";
        var body = BuildLowStockBody(alert);

        return SendEmailAsync(
            new EmailMessage(settings.AdminAlertEmail, subject, body),
            cancellationToken);
    }

    private static SecureSocketOptions GetSecureSocketOptions(int port)
    {
        return port == 465
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;
    }

    private static string BuildLowStockBody(LowStockAlertEmail alert)
    {
        var partNumber = string.IsNullOrWhiteSpace(alert.PartNumber)
            ? "N/A"
            : alert.PartNumber.Trim();
        var vendorName = string.IsNullOrWhiteSpace(alert.VendorName)
            ? "N/A"
            : alert.VendorName.Trim();

        return $"""
            Low stock alert

            Part: {alert.PartName.Trim()}
            Part number: {partNumber}
            Current stock: {alert.CurrentStock}
            Reorder level: {alert.ReorderLevel}
            Vendor: {vendorName}

            Please review inventory and restock if needed.
            """;
    }

    private static void ValidateMessage(EmailMessage message)
    {
        ValidateEmailAddress(message.To, "Recipient email");

        if (string.IsNullOrWhiteSpace(message.Subject))
        {
            throw new ArgumentException("Email subject is required.", nameof(message));
        }

        if (string.IsNullOrWhiteSpace(message.Body))
        {
            throw new ArgumentException("Email body is required.", nameof(message));
        }
    }

    private static void ValidateSettings(EmailSettings settings)
    {
        if (!settings.IsValidForSending())
        {
            throw new InvalidOperationException(
                "EmailSettings is incomplete. Configure SMTP host, port, sender, username, password, and admin alert email.");
        }

        ValidateEmailAddress(settings.SenderEmail, "Sender email");
        ValidateEmailAddress(settings.AdminAlertEmail, "Admin alert email");
    }

    private static void ValidateEmailAddress(string email, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException($"{fieldName} is required.");
        }

        try
        {
            var parsed = new System.Net.Mail.MailAddress(email.Trim());
            if (!string.Equals(parsed.Address, email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                throw new FormatException("Email address must not include a display name.");
            }
        }
        catch (FormatException exception)
        {
            throw new ArgumentException($"{fieldName} is not a valid email address.", exception);
        }
    }
}
