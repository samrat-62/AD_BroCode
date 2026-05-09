using Backend.Models.Inventory;

namespace Backend.Models.Sales;

public sealed class OrderItem
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public Guid PartId { get; set; }

    public string PartName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Subtotal { get; set; }

    public Order Order { get; set; } = null!;

    public Part Part { get; set; } = null!;
}
