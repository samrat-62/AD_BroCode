using Backend.Data;
using Backend.DTOs.Customer;
using Backend.Models.AI;
using Backend.Models.Vehicles;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Customer;

[Route("api/ai")]
public sealed class CustomerAiController : CustomerControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public CustomerAiController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("predictions")]
    public async Task<ActionResult<IReadOnlyList<AIPredictionDto>>> ListAllPredictions(
        CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var predictions = await _dbContext.AIPredictions
            .Include(prediction => prediction.Vehicle)
            .AsNoTracking()
            .Where(prediction => prediction.CustomerId == customer.Id)
            .OrderByDescending(prediction => prediction.PredictedAt)
            .Select(prediction => ToDto(prediction))
            .ToListAsync(cancellationToken);

        return Ok(predictions);
    }

    [HttpGet("predictions/{vehicleId:guid}")]
    public async Task<ActionResult<IReadOnlyList<AIPredictionDto>>> ListVehiclePredictions(
        Guid vehicleId,
        CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var vehicleExists = await _dbContext.Vehicles
            .AnyAsync(vehicle => vehicle.Id == vehicleId && vehicle.CustomerId == customer.Id, cancellationToken);

        if (!vehicleExists)
        {
            return NotFound(new { message = "Vehicle was not found." });
        }

        var predictions = await _dbContext.AIPredictions
            .Include(prediction => prediction.Vehicle)
            .AsNoTracking()
            .Where(prediction => prediction.CustomerId == customer.Id && prediction.VehicleId == vehicleId)
            .OrderByDescending(prediction => prediction.PredictedAt)
            .Select(prediction => ToDto(prediction))
            .ToListAsync(cancellationToken);

        return Ok(predictions);
    }

    private static AIPredictionDto ToDto(AIPrediction prediction)
    {
        return new AIPredictionDto(
            prediction.Id,
            prediction.VehicleId,
            FormatVehicleLabel(prediction.Vehicle),
            prediction.PartName,
            ToRiskString(prediction.RiskLevel),
            prediction.RecommendedAction,
            prediction.EstimatedFailureWindow,
            prediction.PredictedAt);
    }

    private static string ToRiskString(AIPredictionRiskLevel riskLevel)
    {
        return riskLevel switch
        {
            AIPredictionRiskLevel.Medium => "medium",
            AIPredictionRiskLevel.High => "high",
            _ => "low"
        };
    }

    private static string FormatVehicleLabel(Vehicle vehicle)
    {
        return $"{vehicle.Year} {vehicle.Make} {vehicle.Model} ({vehicle.Plate})";
    }
}
