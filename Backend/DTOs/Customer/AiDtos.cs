namespace Backend.DTOs.Customer;

public sealed record AIPredictionDto(
    Guid Id,
    Guid VehicleId,
    string VehicleLabel,
    string PartName,
    string RiskLevel,
    string RecommendedAction,
    string? EstimatedFailureWindow,
    DateTimeOffset PredictedAt);
