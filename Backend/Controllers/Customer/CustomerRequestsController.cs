using Backend.Data;
using Backend.DTOs.Customer;
using Backend.Models.Requests;
using Backend.Models.Vehicles;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Customer;

[Route("api/requests")]
public sealed class CustomerRequestsController : CustomerControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public CustomerRequestsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PartRequestDto>>> ListPartRequests(
        CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var requests = await _dbContext.PartRequests
            .Include(request => request.Vehicle)
            .AsNoTracking()
            .Where(request => request.CustomerId == customer.Id)
            .OrderByDescending(request => request.CreatedAt)
            .Select(request => ToDto(request))
            .ToListAsync(cancellationToken);

        return Ok(requests);
    }

    [HttpPost]
    public async Task<ActionResult<PartRequestDto>> CreatePartRequest(
        PartRequestInputDto request,
        CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        Vehicle? vehicle = null;
        if (request.VehicleId.HasValue)
        {
            vehicle = await _dbContext.Vehicles
                .SingleOrDefaultAsync(
                    item => item.Id == request.VehicleId.Value && item.CustomerId == customer.Id,
                    cancellationToken);

            if (vehicle is null)
            {
                return BadRequest(new { message = "Vehicle was not found." });
            }
        }

        var partRequest = new PartRequest
        {
            CustomerId = customer.Id,
            VehicleId = vehicle?.Id,
            PartName = request.PartName.Trim(),
            PartNumber = NormalizeOptionalNullable(request.PartNumber),
            Description = NormalizeOptionalNullable(request.Description),
            ImageUrl = NormalizeOptionalNullable(request.ImageUrl),
            Status = PartRequestStatus.Pending
        };

        _dbContext.PartRequests.Add(partRequest);
        await _dbContext.SaveChangesAsync(cancellationToken);

        partRequest.Vehicle = vehicle;

        return StatusCode(StatusCodes.Status201Created, ToDto(partRequest));
    }

    private static PartRequestDto ToDto(PartRequest request)
    {
        return new PartRequestDto(
            request.Id,
            request.PartName,
            request.PartNumber,
            request.VehicleId,
            request.Vehicle is null ? null : FormatVehicleLabel(request.Vehicle),
            request.Description,
            request.ImageUrl,
            ToStatusString(request.Status),
            request.CreatedAt);
    }

    private static string ToStatusString(PartRequestStatus status)
    {
        return status switch
        {
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
