using Backend.Models.Inventory;

namespace Backend.Models.Purchasing;

public sealed class PurchaseInvoiceItem
{
    public Guid Id { get; set; }

    public Guid PurchaseInvoiceId { get; set; }

    public Guid PartId { get; set; }

    public string PartName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitCost { get; set; }

    public decimal Subtotal { get; set; }

    public int StockBefore { get; set; }

    public int StockAfter { get; set; }

    public PurchaseInvoice PurchaseInvoice { get; set; } = null!;

    public Part Part { get; set; } = null!;
}
