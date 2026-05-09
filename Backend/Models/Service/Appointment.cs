using Backend.Models.Reviews;
using Backend.Models.Users;
using Backend.Models.Vehicles;

namespace Backend.Models.Service;

public sealed class Appointment
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public Guid VehicleId { get; set; }

    public string ServiceType { get; set; } = string.Empty;

    public DateTimeOffset ScheduledAt { get; set; }

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;

    public string? Notes { get; set; }

    public string? Technician { get; set; }

    public decimal? Cost { get; set; }

    public bool HasReview { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Customer Customer { get; set; } = null!;

    public Vehicle Vehicle { get; set; } = null!;

    public Review? Review { get; set; }
}
