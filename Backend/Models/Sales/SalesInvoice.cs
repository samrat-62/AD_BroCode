using Backend.Models.Credits;
using Backend.Models.Users;
using Backend.Models.Vehicles;

namespace Backend.Models.Sales;

public sealed class SalesInvoice
{
    public Guid Id { get; set; }

    public string InvoiceNumber { get; set; } = string.Empty;

    public Guid? CustomerId { get; set; }

    public string? WalkInName { get; set; }

    public Guid? VehicleId { get; set; }

    public Guid? StaffId { get; set; }

    public string StaffName { get; set; } = string.Empty;

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Paid;

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Card;

    public decimal Subtotal { get; set; }

    public decimal Discount { get; set; }

    public decimal Total { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Customer? Customer { get; set; }

    public Vehicle? Vehicle { get; set; }

    public Staff? Staff { get; set; }

    public ICollection<SalesInvoiceItem> Items { get; set; } = new List<SalesInvoiceItem>();

    public ICollection<CreditTransaction> CreditTransactions { get; set; } = new List<CreditTransaction>();
}
