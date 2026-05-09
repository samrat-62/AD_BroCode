using Backend.Data;
using Backend.DTOs.Customer;
using Backend.Models.Reviews;
using Backend.Models.Service;
using Backend.Models.Vehicles;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Customer;

[Route("api/reviews")]
public sealed class CustomerReviewsController : CustomerControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public CustomerReviewsController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ReviewDto>>> ListMyReviews(CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        var reviews = await _dbContext.Reviews
            .Include(review => review.Appointment)
            .ThenInclude(appointment => appointment!.Vehicle)
            .AsNoTracking()
            .Where(review => review.CustomerId == customer.Id)
            .OrderByDescending(review => review.CreatedAt)
            .Select(review => ToDto(review))
            .ToListAsync(cancellationToken);

        return Ok(reviews);
    }

    [HttpPost]
    public async Task<ActionResult<ReviewDto>> CreateReview(
        ReviewInputDto request,
        CancellationToken cancellationToken)
    {
        var customer = await GetCurrentCustomerAsync(_dbContext, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer profile was not found." });
        }

        Appointment? appointment = null;
        if (request.AppointmentId.HasValue)
        {
            appointment = await _dbContext.Appointments
                .Include(item => item.Vehicle)
                .SingleOrDefaultAsync(
                    item => item.Id == request.AppointmentId.Value && item.CustomerId == customer.Id,
                    cancellationToken);

            if (appointment is null)
            {
                return BadRequest(new { message = "Appointment was not found." });
            }

            if (appointment.HasReview)
            {
                return Conflict(new { message = "This appointment already has a review." });
            }
        }

        var review = new Review
        {
            CustomerId = customer.Id,
            AppointmentId = appointment?.Id,
            Rating = request.Rating,
            Title = NormalizeOptionalNullable(request.Title),
            Body = request.Body.Trim(),
            Status = ReviewStatus.Pending
        };

        if (appointment is not null)
        {
            appointment.HasReview = true;
        }

        _dbContext.Reviews.Add(review);
        await _dbContext.SaveChangesAsync(cancellationToken);

        review.Appointment = appointment;

        return StatusCode(StatusCodes.Status201Created, ToDto(review));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteReview(Guid id, CancellationToken cancellationToken)
    {
        var review = await _dbContext.Reviews
            .Include(item => item.Customer)
            .SingleOrDefaultAsync(
                item => item.Id == id && item.Customer.UserId == CurrentUserId,
                cancellationToken);

        if (review is null)
        {
            return NotFound(new { message = "Review was not found." });
        }

        if (review.AppointmentId.HasValue)
        {
            await _dbContext.Appointments
                .Where(appointment => appointment.Id == review.AppointmentId.Value)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(appointment => appointment.HasReview, false),
                    cancellationToken);
        }

        _dbContext.Reviews.Remove(review);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static ReviewDto ToDto(Review review)
    {
        return new ReviewDto(
            review.Id,
            review.AppointmentId,
            review.Appointment is null ? null : FormatAppointmentLabel(review.Appointment),
            review.Rating,
            review.Title,
            review.Body,
            review.Status == ReviewStatus.Published ? "published" : "pending",
            review.CreatedAt);
    }

    private static string FormatAppointmentLabel(Appointment appointment)
    {
        return $"{appointment.ServiceType} - {FormatVehicleLabel(appointment.Vehicle)}";
    }

    private static string FormatVehicleLabel(Vehicle vehicle)
    {
        return $"{vehicle.Year} {vehicle.Make} {vehicle.Model} ({vehicle.Plate})";
    }
}
