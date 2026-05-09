using Backend.Data;
using Backend.DTOs.Customer;
using Backend.Models.Service;
using Backend.Models.Vehicles;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Customer;

[Route("api/appointments")]
public sealed class CustomerAppointmentsController : CustomerControllerBase
{
    private static readonly string[] DefaultTimeSlots =
    {
        "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
    };

    private readonly ApplicationDbContext _dbContext;

    public CustomerAppointmentsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AppointmentDto>>> ListAppointments(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var query = _dbContext.Appointments
            .Include(appointment => appointment.Vehicle)
            .AsNoTracking()
            .Where(appointment => appointment.CustomerId == customer.Id);

        query = status?.Trim().ToLowerInvariant() switch
        {
            "upcoming" => query.Where(appointment =>
                appointment.Status == AppointmentStatus.Pending ||
                appointment.Status == AppointmentStatus.Confirmed),
            "past" => query.Where(appointment =>
                appointment.Status == AppointmentStatus.Completed ||
                appointment.Status == AppointmentStatus.Cancelled),
            _ => query
        };

        var appointments = await query
            .OrderByDescending(appointment => appointment.ScheduledAt)
            .Select(appointment => ToDto(appointment))
            .ToListAsync(cancellationToken);

        return Ok(appointments);
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> CreateAppointment(
        AppointmentInputDto request,
        CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var vehicle = await _dbContext.Vehicles
            .SingleOrDefaultAsync(
                item => item.Id == request.VehicleId && item.CustomerId == customer.Id,
                cancellationToken);

        if (vehicle is null)
        {
            return BadRequest(new { message = "Vehicle was not found." });
        }

        var appointment = new Appointment
        {
            CustomerId = customer.Id,
            VehicleId = vehicle.Id,
            ServiceType = request.ServiceType.Trim(),
            ScheduledAt = request.ScheduledAt.ToUniversalTime(),
            Status = ParseStatus(request.Status),
            Notes = NormalizeOptionalNullable(request.Notes)
        };

        _dbContext.Appointments.Add(appointment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        appointment.Vehicle = vehicle;
        return StatusCode(StatusCodes.Status201Created, ToDto(appointment));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AppointmentDto>> UpdateAppointment(
        Guid id,
        AppointmentInputDto request,
        CancellationToken cancellationToken)
    {
        var appointment = await FindOwnedAppointment(id, cancellationToken);

        if (appointment is null)
        {
            return NotFound(new { message = "Appointment was not found." });
        }

        var vehicle = await _dbContext.Vehicles
            .SingleOrDefaultAsync(
                item => item.Id == request.VehicleId && item.CustomerId == appointment.CustomerId,
                cancellationToken);

        if (vehicle is null)
        {
            return BadRequest(new { message = "Vehicle was not found." });
        }

        appointment.VehicleId = vehicle.Id;
        appointment.Vehicle = vehicle;
        appointment.ServiceType = request.ServiceType.Trim();
        appointment.ScheduledAt = request.ScheduledAt.ToUniversalTime();
        appointment.Status = ParseStatus(request.Status);
        appointment.Notes = NormalizeOptionalNullable(request.Notes);
        appointment.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(appointment));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> CancelAppointment(Guid id, CancellationToken cancellationToken)
    {
        var appointment = await FindOwnedAppointment(id, cancellationToken);

        if (appointment is null)
        {
            return NotFound(new { message = "Appointment was not found." });
        }

        appointment.Status = AppointmentStatus.Cancelled;
        appointment.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("time-slots")]
    public async Task<ActionResult<IReadOnlyList<string>>> ListAvailableTimeSlots(
        [FromQuery] DateOnly date,
        CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var start = new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        var end = new DateTimeOffset(date.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));

        var bookedSlots = await _dbContext.Appointments
            .AsNoTracking()
            .Where(appointment =>
                appointment.ScheduledAt >= start &&
                appointment.ScheduledAt < end &&
                (appointment.Status == AppointmentStatus.Pending ||
                 appointment.Status == AppointmentStatus.Confirmed))
            .Select(appointment => appointment.ScheduledAt.ToString("HH:mm"))
            .ToListAsync(cancellationToken);

        var available = DefaultTimeSlots
            .Where(slot => !bookedSlots.Contains(slot))
            .ToList();

        return Ok(available);
    }

    private async Task<Appointment?> FindOwnedAppointment(Guid id, CancellationToken cancellationToken)
    {
        if (CurrentUserId is not { } userId)
        {
            return null;
        }

        return await _dbContext.Appointments
            .Include(appointment => appointment.Customer)
            .Include(appointment => appointment.Vehicle)
            .SingleOrDefaultAsync(
                appointment => appointment.Id == id && appointment.Customer.UserId == userId,
                cancellationToken);
    }

    private static AppointmentStatus ParseStatus(string? status)
    {
        return status?.Trim().ToLowerInvariant() switch
        {
            "confirmed" => AppointmentStatus.Confirmed,
            "completed" => AppointmentStatus.Completed,
            "cancelled" => AppointmentStatus.Cancelled,
            _ => AppointmentStatus.Pending
        };
    }

    private static AppointmentDto ToDto(Appointment appointment)
    {
        return new AppointmentDto(
            appointment.Id,
            appointment.VehicleId,
            FormatVehicleLabel(appointment.Vehicle),
            appointment.ServiceType,
            appointment.ScheduledAt,
            ToStatusString(appointment.Status),
            appointment.Notes,
            appointment.Technician,
            appointment.Cost,
            appointment.HasReview);
    }

    private static string ToStatusString(AppointmentStatus status)
    {
        return status switch
        {
            AppointmentStatus.Confirmed => "confirmed",
            AppointmentStatus.Completed => "completed",
            AppointmentStatus.Cancelled => "cancelled",
            _ => "pending"
        };
    }

    private static string FormatVehicleLabel(Vehicle vehicle)
    {
        return $"{vehicle.Year} {vehicle.Make} {vehicle.Model} ({vehicle.Plate})";
    }
}
