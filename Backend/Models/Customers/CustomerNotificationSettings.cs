using Backend.Models.Users;

namespace Backend.Models.Customers;

public sealed class CustomerNotificationSettings
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public bool EmailInvoices { get; set; } = true;

    public bool AppointmentReminders { get; set; } = true;

    public bool AiAlerts { get; set; } = true;

    public bool PromotionalOffers { get; set; }

    public bool OverdueReminders { get; set; } = true;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Customer Customer { get; set; } = null!;
}
