using Backend.Data;
using Backend.DTOs.Staff;
using Backend.Models.Notifications;
using Backend.Models.Sales;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Staff;

public sealed class StaffOrdersController : StaffControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public StaffOrdersController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("orders")]
    public async Task<ActionResult<IReadOnlyList<StaffCustomerOrderDto>>> ListOrders(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var query = BaseOrderQuery();

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var parsedStatus = ParseStatus(status);
            query = query.Where(order => order.Status == parsedStatus);
        }

        var orders = await query
            .OrderByDescending(order => order.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        return Ok(orders.Select(ToDto).ToList());
    }

    [HttpPut("orders/{id:guid}/status")]
    public async Task<ActionResult<StaffCustomerOrderDto>> UpdateOrderStatus(
        Guid id,
        UpdateStaffCustomerOrderStatusDto request,
        CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(item => item.Customer)
            .ThenInclude(customer => customer.User)
            .Include(item => item.Items)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (order is null)
        {
            return NotFound(new { message = "Order was not found." });
        }

        order.Status = ParseStatus(request.Status);
        order.UpdatedAt = DateTimeOffset.UtcNow;

        _dbContext.UserNotifications.Add(new UserNotification
        {
            UserId = order.Customer.UserId,
            Audience = NotificationAudience.Customer,
            Type = UserNotificationType.Order,
            Title = "Order status updated",
            Message = $"Your order {order.OrderNumber} is now {ToStatusString(order.Status)}.",
            Link = "/history"
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(order));
    }

    private IQueryable<Order> BaseOrderQuery()
    {
        return _dbContext.Orders
            .Include(order => order.Customer)
            .ThenInclude(customer => customer.User)
            .Include(order => order.Items)
            .AsNoTracking();
    }

    private static OrderStatus ParseStatus(string status)
    {
        return status.Trim().ToLowerInvariant() switch
        {
            "delivered" or "completed" => OrderStatus.Completed,
            "processing" => OrderStatus.Processing,
            "cancelled" or "canceled" => OrderStatus.Cancelled,
            _ => OrderStatus.Pending
        };
    }

    internal static StaffCustomerOrderDto ToDto(Order order)
    {
        return new StaffCustomerOrderDto(
            order.Id,
            order.OrderNumber,
            order.CustomerId,
            order.Customer.User.FullName,
            order.Customer.User.Email,
            order.Customer.Phone,
            ToStatusString(order.Status),
            order.DeliveryType == OrderDeliveryType.Delivery ? "delivery" : "pickup",
            ToPaymentMethodString(order.PaymentMethod),
            order.DeliveryAddress,
            order.Subtotal,
            order.Discount,
            order.Total,
            order.CreatedAt,
            order.UpdatedAt,
            order.Items.Select(item => new StaffCustomerOrderItemDto(
                item.Id,
                item.PartId,
                item.PartName,
                item.Quantity,
                item.UnitPrice,
                item.Subtotal)).ToList());
    }

    internal static string ToStatusString(OrderStatus status)
    {
        return status switch
        {
            OrderStatus.Processing => "processing",
            OrderStatus.Completed => "delivered",
            OrderStatus.Cancelled => "cancelled",
            _ => "pending"
        };
    }

    internal static string ToPaymentMethodString(PaymentMethod method)
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
