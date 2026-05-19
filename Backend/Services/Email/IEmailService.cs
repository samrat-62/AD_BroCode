namespace Backend.Services.Email;

public interface IEmailService
{
    Task SendEmailAsync(EmailMessage message, CancellationToken cancellationToken = default);

    Task SendLowStockAlertAsync(LowStockAlertEmail alert, CancellationToken cancellationToken = default);
}
