namespace Backend.Services.Email;

public sealed class EmailSettings
{
    public const string SectionName = "EmailSettings";

    public string SmtpHost { get; init; } = string.Empty;

    public int SmtpPort { get; init; } = 587;

    public string SenderEmail { get; init; } = string.Empty;

    public string SenderName { get; init; } = string.Empty;

    public string UserName { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;

    public string AdminAlertEmail { get; init; } = string.Empty;

    public int TimeoutSeconds { get; init; } = 30;

    public bool IsValidForSending()
    {
        return !string.IsNullOrWhiteSpace(SmtpHost)
            && SmtpPort is > 0 and <= 65535
            && !string.IsNullOrWhiteSpace(SenderEmail)
            && !string.IsNullOrWhiteSpace(SenderName)
            && !string.IsNullOrWhiteSpace(UserName)
            && !string.IsNullOrWhiteSpace(Password)
            && !string.IsNullOrWhiteSpace(AdminAlertEmail)
            && TimeoutSeconds > 0;
    }
}
