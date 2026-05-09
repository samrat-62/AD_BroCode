using Backend.Models.AI;
using Backend.Models.Requests;
using Backend.Models.Sales;
using Backend.Models.Service;
using Backend.Models.Users;

namespace Backend.Models.Vehicles;

public sealed class Vehicle
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public string Make { get; set; } = string.Empty;

    public string Model { get; set; } = string.Empty;

    public int Year { get; set; }

    public string Plate { get; set; } = string.Empty;

    public string? Color { get; set; }

    public int? EngineCc { get; set; }

    public VehicleFuelType? FuelType { get; set; }

    public string? PhotoUrl { get; set; }

    public VehicleStatus Status { get; set; } = VehicleStatus.Active;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Customer Customer { get; set; } = null!;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public ICollection<ServiceRecord> ServiceRecords { get; set; } = new List<ServiceRecord>();

    public ICollection<SalesInvoice> SalesInvoices { get; set; } = new List<SalesInvoice>();

    public ICollection<PartRequest> PartRequests { get; set; } = new List<PartRequest>();

    public ICollection<AIPrediction> AIPredictions { get; set; } = new List<AIPrediction>();
}
