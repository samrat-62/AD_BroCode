using Backend.Data;
using Backend.DTOs.Customer;
using Backend.Models.Vehicles;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Customer;

[Route("api/vehicles")]
public sealed class CustomerVehiclesController : CustomerControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public CustomerVehiclesController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<VehicleDto>>> ListVehicles(CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var vehicles = await _dbContext.Vehicles
            .AsNoTracking()
            .Where(vehicle => vehicle.CustomerId == customer.Id)
            .OrderByDescending(vehicle => vehicle.CreatedAt)
            .Select(vehicle => ToDto(vehicle))
            .ToListAsync(cancellationToken);

        return Ok(vehicles);
    }

    [HttpPost]
    public async Task<ActionResult<VehicleDto>> CreateVehicle(
        VehicleInputDto request,
        CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var vehicle = new Vehicle
        {
            CustomerId = customer.Id,
            Make = request.Make.Trim(),
            Model = request.Model.Trim(),
            Year = request.Year,
            Plate = request.Plate.Trim().ToUpperInvariant(),
            Color = NormalizeOptionalNullable(request.Color),
            EngineCc = request.EngineCC,
            FuelType = ParseFuelType(request.FuelType),
            PhotoUrl = NormalizeOptionalNullable(request.PhotoUrl),
            Status = ParseStatus(request.Status)
        };

        _dbContext.Vehicles.Add(vehicle);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ToDto(vehicle));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<VehicleDto>> GetVehicle(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await FindOwnedVehicle(id, cancellationToken);

        if (vehicle is null)
        {
            return NotFound(new { message = "Vehicle was not found." });
        }

        return Ok(ToDto(vehicle));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VehicleDto>> UpdateVehicle(
        Guid id,
        VehicleInputDto request,
        CancellationToken cancellationToken)
    {
        var vehicle = await FindOwnedVehicle(id, cancellationToken);

        if (vehicle is null)
        {
            return NotFound(new { message = "Vehicle was not found." });
        }

        vehicle.Make = request.Make.Trim();
        vehicle.Model = request.Model.Trim();
        vehicle.Year = request.Year;
        vehicle.Plate = request.Plate.Trim().ToUpperInvariant();
        vehicle.Color = NormalizeOptionalNullable(request.Color);
        vehicle.EngineCc = request.EngineCC;
        vehicle.FuelType = ParseFuelType(request.FuelType);
        vehicle.PhotoUrl = NormalizeOptionalNullable(request.PhotoUrl);
        vehicle.Status = ParseStatus(request.Status);
        vehicle.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(vehicle));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteVehicle(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await FindOwnedVehicle(id, cancellationToken);

        if (vehicle is null)
        {
            return NotFound(new { message = "Vehicle was not found." });
        }

        _dbContext.Vehicles.Remove(vehicle);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task<Vehicle?> FindOwnedVehicle(Guid id, CancellationToken cancellationToken)
    {
        if (CurrentUserId is not { } userId)
        {
            return null;
        }

        return await _dbContext.Vehicles
            .Include(vehicle => vehicle.Customer)
            .SingleOrDefaultAsync(
                vehicle => vehicle.Id == id && vehicle.Customer.UserId == userId,
                cancellationToken);
    }

    private static VehicleStatus ParseStatus(string? status)
    {
        return string.Equals(status, "inactive", StringComparison.OrdinalIgnoreCase)
            ? VehicleStatus.Inactive
            : VehicleStatus.Active;
    }

    private static VehicleFuelType? ParseFuelType(string? fuelType)
    {
        if (string.IsNullOrWhiteSpace(fuelType))
        {
            return null;
        }

        return fuelType.Trim().ToLowerInvariant() switch
        {
            "diesel" => VehicleFuelType.Diesel,
            "electric" => VehicleFuelType.Electric,
            "hybrid" => VehicleFuelType.Hybrid,
            _ => VehicleFuelType.Petrol
        };
    }

    private static VehicleDto ToDto(Vehicle vehicle)
    {
        return new VehicleDto(
            vehicle.Id,
            vehicle.Make,
            vehicle.Model,
            vehicle.Year,
            vehicle.Plate,
            vehicle.Color,
            vehicle.EngineCc,
            vehicle.FuelType?.ToString(),
            vehicle.PhotoUrl,
            vehicle.Status == VehicleStatus.Active ? "active" : "inactive");
    }
}
