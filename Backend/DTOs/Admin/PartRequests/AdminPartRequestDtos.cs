using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Admin.PartRequests;

public sealed record AdminPartRequestsListResponseDto(
    IReadOnlyList<AdminPartRequestDto> Data,
    int Total,
    int Page,
    int Limit,
    int TotalPages);

public sealed record AdminPartRequestDto(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    string CustomerEmail,
    string Phone,
    Guid? VehicleId,
    string? VehicleLabel,
    string PartName,
    string? PartNumber,
    string? Description,
    string? ImageUrl,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record UpdateAdminPartRequestStatusDto(
    [param: Required]
    string Status);
