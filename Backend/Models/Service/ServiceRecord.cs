using Backend.Models.Users;
using Backend.Models.Vehicles;

namespace Backend.Models.Service;

public sealed class ServiceRecord
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public Guid? VehicleId { get; set; }

    public DateTimeOffset Date { get; set; }

    public string ServiceType { get; set; } = string.Empty;

    public string Technician { get; set; } = string.Empty;

    public decimal Cost { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Customer Customer { get; set; } = null!;

    public Vehicle? Vehicle { get; set; }
}
