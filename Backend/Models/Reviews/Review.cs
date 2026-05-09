using Backend.Models.Service;
using Backend.Models.Users;

namespace Backend.Models.Reviews;

public sealed class Review
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public Guid? AppointmentId { get; set; }

    public int Rating { get; set; }

    public string? Title { get; set; }

    public string Body { get; set; } = string.Empty;

    public ReviewStatus Status { get; set; } = ReviewStatus.Pending;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Customer Customer { get; set; } = null!;

    public Appointment? Appointment { get; set; }
}
