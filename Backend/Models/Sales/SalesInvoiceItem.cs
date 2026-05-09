using Backend.Models.Inventory;

namespace Backend.Models.Sales;

public sealed class SalesInvoiceItem
{
    public Guid Id { get; set; }

    public Guid SalesInvoiceId { get; set; }

    public Guid PartId { get; set; }

    public string? PartNumber { get; set; }

    public string PartName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Subtotal { get; set; }

    public int StockBefore { get; set; }

    public int StockAfter { get; set; }

    public SalesInvoice SalesInvoice { get; set; } = null!;

    public Part Part { get; set; } = null!;
}
