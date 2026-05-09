using Backend.Models.Users;
using Backend.Models.Vehicles;

namespace Backend.Models.AI;

public sealed class AIPrediction
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public Guid VehicleId { get; set; }

    public string PartName { get; set; } = string.Empty;

    public AIPredictionRiskLevel RiskLevel { get; set; } = AIPredictionRiskLevel.Low;

    public string RecommendedAction { get; set; } = string.Empty;

    public string? EstimatedFailureWindow { get; set; }

    public DateTimeOffset PredictedAt { get; set; } = DateTimeOffset.UtcNow;

    public Customer Customer { get; set; } = null!;

    public Vehicle Vehicle { get; set; } = null!;
}
