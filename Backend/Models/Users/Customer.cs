using Backend.Models.AI;
using Backend.Models.Credits;
using Backend.Models.Customers;
using Backend.Models.Notifications;
using Backend.Models.Requests;
using Backend.Models.Reviews;
using Backend.Models.Sales;
using Backend.Models.Service;
using Backend.Models.Vehicles;

namespace Backend.Models.Users;

public sealed class Customer
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Phone { get; set; } = string.Empty;

    public string? Address { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public string? NidNumber { get; set; }

    public string? AvatarUrl { get; set; }

    public decimal CreditLimit { get; set; }

    public decimal CreditBalance { get; set; }

    public decimal TotalSpend { get; set; }

    public int LoyaltyPoints { get; set; }

    public int VisitCount { get; set; }

    public DateTimeOffset? LastVisit { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User User { get; set; } = null!;

    public CustomerNotificationSettings? NotificationSettings { get; set; }

    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public ICollection<ServiceRecord> ServiceRecords { get; set; } = new List<ServiceRecord>();

    public ICollection<Order> Orders { get; set; } = new List<Order>();

    public ICollection<SalesInvoice> SalesInvoices { get; set; } = new List<SalesInvoice>();

    public ICollection<CreditTransaction> CreditTransactions { get; set; } = new List<CreditTransaction>();

    public ICollection<CustomerNote> Notes { get; set; } = new List<CustomerNote>();

    public ICollection<PartRequest> PartRequests { get; set; } = new List<PartRequest>();

    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    public ICollection<AIPrediction> AIPredictions { get; set; } = new List<AIPrediction>();
}
