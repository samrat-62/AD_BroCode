using Backend.Models.Sales;

namespace Backend.Models.Users;

public sealed class Staff
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public StaffRole StaffRole { get; set; } = StaffRole.SalesStaff;

    public string? PhoneNumber { get; set; }

    public DateOnly JoinDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;

    public ICollection<SalesInvoice> SalesInvoices { get; set; } = new List<SalesInvoice>();
}
