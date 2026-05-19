using Backend.Data;
using Backend.DTOs.Staff;
using Backend.Models.Credits;
using Backend.Models.Sales;
using Backend.Services.Email;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Backend.Controllers.Staff;

public sealed class StaffReportsController : StaffControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IEmailService _emailService;
    private readonly ILogger<StaffReportsController> _logger;

    public StaffReportsController(
        ApplicationDbContext dbContext,
        IEmailService emailService,
        ILogger<StaffReportsController> logger)
    {
        _dbContext = dbContext;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpGet("reports/regular-customers")]
    public async Task<ActionResult<IReadOnlyList<StaffRegularCustomerReportRowDto>>> GetRegularCustomersReport(
        [FromQuery] int minVisits = 2,
        CancellationToken cancellationToken = default)
    {
        minVisits = Math.Max(1, minVisits);

        var rows = await _dbContext.Customers
            .Include(customer => customer.User)
            .AsNoTracking()
            .Where(customer => customer.VisitCount >= minVisits)
            .OrderByDescending(customer => customer.VisitCount)
            .Select(customer => new StaffRegularCustomerReportRowDto(
                customer.Id,
                customer.User.FullName,
                customer.Phone,
                customer.VisitCount,
                customer.TotalSpend,
                customer.LastVisit ?? customer.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    [HttpGet("reports/high-spenders")]
    public async Task<ActionResult<IReadOnlyList<StaffHighSpenderReportRowDto>>> GetHighSpendersReport(
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit, 1, 100);

        var rows = await _dbContext.Customers
            .Include(customer => customer.User)
            .AsNoTracking()
            .OrderByDescending(customer => customer.TotalSpend)
            .Take(limit)
            .Select(customer => new StaffHighSpenderReportRowDto(
                customer.Id,
                customer.User.FullName,
                customer.TotalSpend,
                customer.VisitCount > 0 ? customer.TotalSpend / customer.VisitCount : customer.TotalSpend,
                customer.VisitCount))
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    [HttpGet("reports/pending-credits")]
    public async Task<ActionResult<IReadOnlyList<StaffPendingCreditReportRowDto>>> GetPendingCreditsReport(
        CancellationToken cancellationToken)
    {
        var customers = await _dbContext.Customers
            .Include(customer => customer.User)
            .AsNoTracking()
            .Where(customer => customer.CreditBalance > 0)
            .OrderByDescending(customer => customer.CreditBalance)
            .ToListAsync(cancellationToken);

        var customerIds = customers.Select(customer => customer.Id).ToList();
        var lastPayments = await _dbContext.CreditTransactions
            .AsNoTracking()
            .Where(transaction =>
                customerIds.Contains(transaction.CustomerId) &&
                transaction.Type == CreditTransactionType.Payment)
            .GroupBy(transaction => transaction.CustomerId)
            .Select(group => new
            {
                CustomerId = group.Key,
                LastPaymentDate = group.Max(transaction => transaction.Date)
            })
            .ToDictionaryAsync(item => item.CustomerId, item => item.LastPaymentDate, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var rows = customers
            .Select(customer =>
            {
                var basis = lastPayments.TryGetValue(customer.Id, out var lastPayment)
                    ? lastPayment
                    : customer.LastVisit ?? customer.CreatedAt;

                return new StaffPendingCreditReportRowDto(
                    customer.Id,
                    customer.User.FullName,
                    customer.Phone,
                    customer.User.Email,
                    customer.CreditBalance,
                    Math.Max(0, (int)Math.Floor((now - basis).TotalDays)),
                    lastPayments.TryGetValue(customer.Id, out var paymentDate) ? paymentDate : null);
            })
            .OrderByDescending(row => row.DaysOverdue)
            .ThenByDescending(row => row.CreditAmount)
            .ToList();

        return Ok(rows);
    }

    [HttpGet("reports/sales-summary")]
    public async Task<ActionResult<StaffSalesSummaryReportDto>> GetSalesSummaryReport(
        CancellationToken cancellationToken)
    {
        var invoices = await _dbContext.SalesInvoices
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var totalSales = invoices.Sum(invoice => invoice.Total);
        var totalInvoices = invoices.Count;
        var paidSales = invoices
            .Where(invoice => invoice.Status != InvoiceStatus.Credit)
            .Sum(invoice => invoice.Total);

        var dailySales = invoices
            .GroupBy(invoice => invoice.CreatedAt.UtcDateTime.ToString("yyyy-MM-dd"))
            .Select(group => new StaffDailySalesDto(
                group.Key,
                group.Sum(invoice => invoice.Total),
                group.Count()))
            .OrderBy(row => row.Date)
            .ToList();

        var invoiceItems = await _dbContext.SalesInvoiceItems
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var topParts = invoiceItems
            .GroupBy(item => new { item.PartId, item.PartNumber, item.PartName })
            .Select(group => new StaffTopPartDto(
                group.Key.PartId,
                group.Key.PartNumber ?? string.Empty,
                group.Key.PartName,
                group.Sum(item => item.Subtotal),
                group.Sum(item => item.Quantity)))
            .OrderByDescending(row => row.Revenue)
            .Take(5)
            .ToList();

        return Ok(new StaffSalesSummaryReportDto(
            totalSales,
            totalInvoices,
            totalInvoices == 0 ? 0m : decimal.Round(totalSales / totalInvoices, 2),
            paidSales,
            dailySales,
            topParts));
    }

    [HttpPost("reports/credit-reminders")]
    public async Task<ActionResult<StaffActionResultDto>> SendCreditReminder(
        SendStaffCreditReminderRequestDto request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.To))
        {
            return BadRequest(new { message = "Recipient email is required." });
        }

        var subject = string.IsNullOrWhiteSpace(request.Subject)
            ? "Credit payment reminder"
            : request.Subject.Trim();
        var message = string.IsNullOrWhiteSpace(request.Message)
            ? "This is a reminder for your pending credit payment."
            : request.Message.Trim();

        try
        {
            await _emailService.SendEmailAsync(
                new EmailMessage(request.To, subject, message),
                cancellationToken);
        }
        catch (Exception exception) when (IsEmailFailure(exception))
        {
            _logger.LogError(exception, "Failed to send credit reminder email.");
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = "Credit reminder email could not be sent. Check SMTP configuration." });
        }

        return Ok(new StaffActionResultDto(Guid.Empty, request.To, DateTimeOffset.UtcNow));
    }

    private static bool IsEmailFailure(Exception exception)
    {
        return exception is EmailSendException
            or InvalidOperationException
            or ArgumentException
            or OptionsValidationException;
    }
}
