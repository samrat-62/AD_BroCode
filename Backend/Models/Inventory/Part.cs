using Backend.Models.Purchasing;
using Backend.Models.Sales;
using Backend.Models.Suppliers;

namespace Backend.Models.Inventory;

public sealed class Part
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? PartNumber { get; set; }

    public Guid CategoryId { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public string[] CompatibleModels { get; set; } = Array.Empty<string>();

    public int Popularity { get; set; }

    public decimal UnitPrice { get; set; }

    public int StockQuantity { get; set; }

    public int ReorderLevel { get; set; } = 5;

    public bool IsActive { get; set; } = true;

    public Guid? VendorId { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public PartCategory Category { get; set; } = null!;

    public Vendor? Vendor { get; set; }

    public ICollection<PurchaseInvoiceItem> PurchaseInvoiceItems { get; set; } = new List<PurchaseInvoiceItem>();

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public ICollection<SalesInvoiceItem> SalesInvoiceItems { get; set; } = new List<SalesInvoiceItem>();
}
