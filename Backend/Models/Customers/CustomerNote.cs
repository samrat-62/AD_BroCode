using Backend.Models.Users;

namespace Backend.Models.Customers;

public sealed class CustomerNote
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public Guid? AuthorUserId { get; set; }

    public string Body { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Customer Customer { get; set; } = null!;

    public User? AuthorUser { get; set; }
}
