using Backend.Models.Customers;
using Backend.Models.Notifications;

namespace Backend.Models.Users;

public sealed class User
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.Customer;

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Customer? Customer { get; set; }

    public Staff? Staff { get; set; }

    public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();

    public ICollection<CustomerNote> AuthoredCustomerNotes { get; set; } = new List<CustomerNote>();

    public ICollection<UserNotification> Notifications { get; set; } = new List<UserNotification>();
}
