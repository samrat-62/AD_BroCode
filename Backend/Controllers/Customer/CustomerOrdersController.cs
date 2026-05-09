using Backend.Data;
using Backend.DTOs.Customer;
using Backend.Models.Notifications;
using Backend.Models.Sales;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Customer;

[Route("api/orders")]
public sealed class CustomerOrdersController : CustomerControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public CustomerOrdersController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> ListOrders(CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var orders = await _dbContext.Orders
            .Include(order => order.Items)
            .AsNoTracking()
            .Where(order => order.CustomerId == customer.Id)
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => ToDto(order))
            .ToListAsync(cancellationToken);

        return Ok(orders);
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> CreateOrder(
        OrderInputDto request,
        CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        if (request.Items.Count == 0)
        {
            return BadRequest(new { message = "At least one order item is required." });
        }

        var requestedPartIds = request.Items.Select(item => item.PartId).Distinct().ToList();
        var parts = await _dbContext.Parts
            .Where(part => requestedPartIds.Contains(part.Id) && part.IsActive)
            .ToDictionaryAsync(part => part.Id, cancellationToken);

        if (parts.Count != requestedPartIds.Count)
        {
            return BadRequest(new { message = "One or more parts were not found." });
        }

        foreach (var item in request.Items)
        {
            var part = parts[item.PartId];
            if (part.StockQuantity < item.Quantity)
            {
                return BadRequest(new { message = $"{part.Name} does not have enough stock." });
            }
        }

        var subtotal = request.Items.Sum(item => parts[item.PartId].UnitPrice * item.Quantity);
        var discountThreshold = await GetLoyaltyDiscountThreshold(cancellationToken);
        var discountPercentage = await GetLoyaltyDiscountPercentage(cancellationToken);
        var discount = subtotal >= discountThreshold ? decimal.Round(subtotal * discountPercentage / 100m, 2) : 0m;
        var total = subtotal - discount;

        var order = new Order
        {
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            CustomerId = customer.Id,
            Subtotal = subtotal,
            Discount = discount,
            Total = total,
            Status = OrderStatus.Pending,
            DeliveryType = ParseDeliveryType(request.DeliveryType),
            PaymentMethod = ParsePaymentMethod(request.PaymentMethod),
            DeliveryAddress = NormalizeOptionalNullable(request.DeliveryAddress)
        };

        foreach (var item in request.Items)
        {
            var part = parts[item.PartId];
            part.StockQuantity -= item.Quantity;
            part.Popularity += item.Quantity;
            part.UpdatedAt = DateTimeOffset.UtcNow;

            order.Items.Add(new OrderItem
            {
                PartId = part.Id,
                PartName = part.Name,
                Quantity = item.Quantity,
                UnitPrice = part.UnitPrice,
                Subtotal = part.UnitPrice * item.Quantity
            });
        }

        customer.TotalSpend += total;
        customer.LoyaltyPoints += (int)Math.Floor(total / 100m);

        _dbContext.Orders.Add(order);
        _dbContext.UserNotifications.Add(new UserNotification
        {
            UserId = customer.UserId,
            Audience = NotificationAudience.Customer,
            Type = UserNotificationType.Order,
            Title = "Order placed",
            Message = $"Your order {order.OrderNumber} has been created."
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ToDto(order));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDto>> GetOrder(Guid id, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(item => item.Customer)
            .Include(item => item.Items)
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item => item.Id == id && item.Customer.UserId == CurrentUserId,
                cancellationToken);

        if (order is null)
        {
            return NotFound(new { message = "Order was not found." });
        }

        return Ok(ToDto(order));
    }

    private async Task<decimal> GetLoyaltyDiscountThreshold(CancellationToken cancellationToken)
    {
        return await _dbContext.AdminSettings
            .AsNoTracking()
            .Select(settings => settings.LoyaltyDiscountThreshold)
            .FirstOrDefaultAsync(cancellationToken) is var threshold && threshold > 0m
            ? threshold
            : 5000m;
    }

    private async Task<decimal> GetLoyaltyDiscountPercentage(CancellationToken cancellationToken)
    {
        return await _dbContext.AdminSettings
            .AsNoTracking()
            .Select(settings => settings.LoyaltyDiscountPercentage)
            .FirstOrDefaultAsync(cancellationToken) is var percentage && percentage > 0m
            ? percentage
            : 10m;
    }

    private static OrderDeliveryType ParseDeliveryType(string value)
    {
        return string.Equals(value, "delivery", StringComparison.OrdinalIgnoreCase)
            ? OrderDeliveryType.Delivery
            : OrderDeliveryType.Pickup;
    }

    private static PaymentMethod ParsePaymentMethod(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "cash" => PaymentMethod.Cash,
            "card" => PaymentMethod.Card,
            "credit" => PaymentMethod.Credit,
            _ => PaymentMethod.CashOnDelivery
        };
    }

    private static OrderDto ToDto(Order order)
    {
        return new OrderDto(
            order.Id,
            order.Total,
            order.Subtotal,
            order.Discount,
            ToStatusString(order.Status),
            order.DeliveryType == OrderDeliveryType.Delivery ? "delivery" : "pickup",
            ToPaymentMethodString(order.PaymentMethod),
            order.CreatedAt,
            order.Items.Select(item => new OrderItemDto(
                item.Id,
                item.PartId,
                item.PartName,
                item.Quantity,
                item.UnitPrice)).ToList());
    }

    private static string ToStatusString(OrderStatus status)
    {
        return status switch
        {
            OrderStatus.Processing => "processing",
            OrderStatus.Completed => "completed",
            OrderStatus.Cancelled => "cancelled",
            _ => "pending"
        };
    }

    private static string ToPaymentMethodString(PaymentMethod method)
    {
        return method switch
        {
            PaymentMethod.Cash => "cash",
            PaymentMethod.Card => "card",
            PaymentMethod.Credit => "credit",
            _ => "cash_on_delivery"
        };
    }
}
