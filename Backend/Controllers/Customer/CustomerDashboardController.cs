using Backend.Data;
using Backend.DTOs.Customer;
using Backend.Models.Requests;
using Backend.Models.Service;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Customer;

[Route("api/dashboard")]
public sealed class CustomerDashboardController : CustomerControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public CustomerDashboardController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetDashboardSummary(
        CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var totalPurchases = await _dbContext.Orders
            .CountAsync(order => order.CustomerId == customer.Id, cancellationToken);
        var activeAppointments = await _dbContext.Appointments
            .CountAsync(
                appointment =>
                    appointment.CustomerId == customer.Id &&
                    (appointment.Status == AppointmentStatus.Pending ||
                     appointment.Status == AppointmentStatus.Confirmed),
                cancellationToken);
        var pendingRequests = await _dbContext.PartRequests
            .CountAsync(
                request => request.CustomerId == customer.Id && request.Status == PartRequestStatus.Pending,
                cancellationToken);
        var vehicleCount = await _dbContext.Vehicles
            .CountAsync(vehicle => vehicle.CustomerId == customer.Id, cancellationToken);

        return Ok(new DashboardSummaryDto(
            totalPurchases,
            activeAppointments,
            customer.LoyaltyPoints,
            pendingRequests,
            customer.TotalSpend,
            vehicleCount));
    }

    [HttpGet("activity")]
    public async Task<ActionResult<IReadOnlyList<ActivityItemDto>>> GetRecentActivity(
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        limit = Math.Clamp(limit, 1, 50);

        var orders = await _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.CustomerId == customer.Id)
            .OrderByDescending(order => order.CreatedAt)
            .Take(limit)
            .Select(order => new ActivityItemDto(
                $"order:{order.Id}",
                "purchase",
                order.OrderNumber,
                ToOrderStatus(order.Status),
                order.Total,
                order.CreatedAt))
            .ToListAsync(cancellationToken);

        var appointments = await _dbContext.Appointments
            .AsNoTracking()
            .Where(appointment => appointment.CustomerId == customer.Id)
            .OrderByDescending(appointment => appointment.ScheduledAt)
            .Take(limit)
            .Select(appointment => new ActivityItemDto(
                $"appointment:{appointment.Id}",
                "appointment",
                appointment.ServiceType,
                ToAppointmentStatus(appointment.Status),
                appointment.Cost,
                appointment.ScheduledAt))
            .ToListAsync(cancellationToken);

        var requests = await _dbContext.PartRequests
            .AsNoTracking()
            .Where(request => request.CustomerId == customer.Id)
            .OrderByDescending(request => request.CreatedAt)
            .Take(limit)
            .Select(request => new ActivityItemDto(
                $"request:{request.Id}",
                "request",
                request.PartName,
                ToRequestStatus(request.Status),
                null,
                request.CreatedAt))
            .ToListAsync(cancellationToken);

        var reviews = await _dbContext.Reviews
            .AsNoTracking()
            .Where(review => review.CustomerId == customer.Id)
            .OrderByDescending(review => review.CreatedAt)
            .Take(limit)
            .Select(review => new ActivityItemDto(
                $"review:{review.Id}",
                "review",
                review.Title ?? "Review submitted",
                review.Status == Models.Reviews.ReviewStatus.Published ? "published" : "pending",
                null,
                review.CreatedAt))
            .ToListAsync(cancellationToken);

        var activity = orders
            .Concat(appointments)
            .Concat(requests)
            .Concat(reviews)
            .OrderByDescending(item => item.OccurredAt)
            .Take(limit)
            .ToList();

        return Ok(activity);
    }

    private static string ToOrderStatus(Models.Sales.OrderStatus status)
    {
        return status switch
        {
            Models.Sales.OrderStatus.Processing => "processing",
            Models.Sales.OrderStatus.Completed => "delivered",
            Models.Sales.OrderStatus.Cancelled => "cancelled",
            _ => "pending"
        };
    }

    private static string ToAppointmentStatus(AppointmentStatus status)
    {
        return status switch
        {
            AppointmentStatus.Confirmed => "confirmed",
            AppointmentStatus.Completed => "completed",
            AppointmentStatus.Cancelled => "cancelled",
            _ => "pending"
        };
    }

    private static string ToRequestStatus(PartRequestStatus status)
    {
        return status switch
        {
            PartRequestStatus.Acknowledged => "acknowledged",
            PartRequestStatus.Found => "found",
            PartRequestStatus.Unavailable => "unavailable",
            _ => "pending"
        };
    }
}
