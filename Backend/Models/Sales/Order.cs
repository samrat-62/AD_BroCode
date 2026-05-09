using Backend.Models.Users;

namespace Backend.Models.Sales;

public sealed class Order
{
    public Guid Id { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public Guid CustomerId { get; set; }

    public decimal Subtotal { get; set; }

    public decimal Discount { get; set; }

    public decimal Total { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public OrderDeliveryType DeliveryType { get; set; } = OrderDeliveryType.Pickup;

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.CashOnDelivery;

    public string? DeliveryAddress { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Customer Customer { get; set; } = null!;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
