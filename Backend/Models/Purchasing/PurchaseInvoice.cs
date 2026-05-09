using Backend.Models.Suppliers;
using Backend.Models.Users;

namespace Backend.Models.Purchasing;

public sealed class PurchaseInvoice
{
    public Guid Id { get; set; }

    public string InvoiceNumber { get; set; } = string.Empty;

    public Guid VendorId { get; set; }

    public decimal TotalCost { get; set; }

    public Guid? CreatedByUserId { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Vendor Vendor { get; set; } = null!;

    public User? CreatedByUser { get; set; }

    public ICollection<PurchaseInvoiceItem> LineItems { get; set; } = new List<PurchaseInvoiceItem>();
}
