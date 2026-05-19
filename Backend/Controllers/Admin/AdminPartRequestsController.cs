using Backend.Data;
using Backend.DTOs.Admin.PartRequests;
using Backend.Models.Notifications;
using Backend.Models.Requests;
using Backend.Models.Vehicles;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Admin;

public sealed class AdminPartRequestsController : AdminControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public AdminPartRequestsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("part-requests")]
    public async Task<ActionResult<AdminPartRequestsListResponseDto>> ListPartRequests(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        limit = Math.Clamp(limit, 1, 100);

        var query = BasePartRequestQuery();
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var parsedStatus = ParseStatus(status);
            query = query.Where(request => request.Status == parsedStatus);
        }

        var total = await query.CountAsync(cancellationToken);
        var requests = await query
            .OrderByDescending(request => request.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return Ok(new AdminPartRequestsListResponseDto(
            requests.Select(ToDto).ToList(),
            total,
            page,
            limit,
            (int)Math.Ceiling(total / (double)limit)));
    }

    [HttpPut("part-requests/{id:guid}/status")]
    public async Task<ActionResult<AdminPartRequestDto>> UpdatePartRequestStatus(
        Guid id,
        UpdateAdminPartRequestStatusDto request,
        CancellationToken cancellationToken)
    {
        var partRequest = await _dbContext.PartRequests
            .Include(item => item.Customer)
            .ThenInclude(customer => customer.User)
            .Include(item => item.Vehicle)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (partRequest is null)
        {
            return NotFound(new { message = "Part request was not found." });
        }

        partRequest.Status = ParseStatus(request.Status);
        partRequest.UpdatedAt = DateTimeOffset.UtcNow;

        _dbContext.UserNotifications.Add(new UserNotification
        {
            UserId = partRequest.Customer.UserId,
            Audience = NotificationAudience.Customer,
            Type = UserNotificationType.System,
            Title = "Part request updated",
            Message = $"Your request for {partRequest.PartName} is now {ToStatusString(partRequest.Status)}.",
            Link = "/requests"
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(partRequest));
    }

    private IQueryable<PartRequest> BasePartRequestQuery()
    {
        return _dbContext.PartRequests
            .Include(request => request.Customer)
            .ThenInclude(customer => customer.User)
            .Include(request => request.Vehicle)
            .AsNoTracking();
    }

    private static PartRequestStatus ParseStatus(string status)
    {
        return status.Trim().ToLowerInvariant() switch
        {
            "acknowledged" or "acknowledge" => PartRequestStatus.Acknowledged,
            "found" => PartRequestStatus.Found,
            "unavailable" => PartRequestStatus.Unavailable,
            _ => PartRequestStatus.Pending
        };
    }

    private static AdminPartRequestDto ToDto(PartRequest request)
    {
        return new AdminPartRequestDto(
            request.Id,
            request.CustomerId,
            request.Customer.User.FullName,
            request.Customer.User.Email,
            request.Customer.Phone,
            request.VehicleId,
            request.Vehicle is null ? null : FormatVehicleLabel(request.Vehicle),
            request.PartName,
            request.PartNumber,
            request.Description,
            request.ImageUrl,
            ToStatusString(request.Status),
            request.CreatedAt,
            request.UpdatedAt);
    }

    private static string ToStatusString(PartRequestStatus status)
    {
        return status switch
        {
            PartRequestStatus.Acknowledged => "acknowledged",
            PartRequestStatus.Found => "found",
            PartRequestStatus.Unavailable => "unavailable",
            _ => "pending"
        };
    }

    private static string FormatVehicleLabel(Vehicle vehicle)
    {
        return $"{vehicle.Year} {vehicle.Make} {vehicle.Model} ({vehicle.Plate})";
    }
}
