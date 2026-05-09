using Backend.Models.Users;
using Backend.Models.Vehicles;

namespace Backend.Models.Requests;

public sealed class PartRequest
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public Guid? VehicleId { get; set; }

    public string PartName { get; set; } = string.Empty;

    public string? PartNumber { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public PartRequestStatus Status { get; set; } = PartRequestStatus.Pending;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Customer Customer { get; set; } = null!;

    public Vehicle? Vehicle { get; set; }
}
