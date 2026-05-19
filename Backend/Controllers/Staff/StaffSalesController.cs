using Backend.Data;
using Backend.DTOs.Staff;
using Backend.Models.Credits;
using Backend.Models.Admin;
using Backend.Models.Inventory;
using Backend.Models.Notifications;
using Backend.Models.Sales;
using Backend.Services.Email;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Staff;

public sealed class StaffSalesController : StaffControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IEmailService _emailService;
    private readonly ILogger<StaffSalesController> _logger;

    public StaffSalesController(
        ApplicationDbContext dbContext,
        IEmailService emailService,
        ILogger<StaffSalesController> logger)
    {
        _dbContext = dbContext;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("sales")]
    public async Task<ActionResult<StaffInvoiceDetailDto>> CreateSale(
        CreateStaffSaleRequestDto request,
        CancellationToken cancellationToken)
    {
        if (request.Items.Count == 0)
        {
            return BadRequest(new { message = "At least one sale item is required." });
        }

        var partIds = request.Items.Select(item => item.PartId).Distinct().ToList();
        var parts = await _dbContext.Parts
            .Where(part => partIds.Contains(part.Id) && part.IsActive)
            .ToDictionaryAsync(part => part.Id, cancellationToken);

        if (parts.Count != partIds.Count)
        {
            return BadRequest(new { message = "One or more parts were not found." });
        }

        foreach (var item in request.Items)
        {
            var part = parts[item.PartId];
            if (part.StockQuantity < item.Quantity)
            {
                return BadRequest(new { message = $"{part.Name} does not have enough stock." });
            }
        }

        var customer = request.CustomerId.HasValue
            ? await _dbContext.Customers
                .Include(item => item.User)
                .Include(item => item.Vehicles)
                .SingleOrDefaultAsync(item => item.Id == request.CustomerId.Value, cancellationToken)
            : null;

        if (request.CustomerId.HasValue && customer is null)
        {
            return BadRequest(new { message = "Customer was not found." });
        }

        if (request.VehicleId.HasValue && customer is not null)
        {
            var ownsVehicle = await _dbContext.Vehicles
                .AnyAsync(
                    vehicle => vehicle.Id == request.VehicleId.Value && vehicle.CustomerId == customer.Id,
                    cancellationToken);

            if (!ownsVehicle)
            {
                return BadRequest(new { message = "Vehicle was not found." });
            }
        }

        var actor = await GetActor(cancellationToken);
        var subtotal = request.Items.Sum(item => parts[item.PartId].UnitPrice * item.Quantity);
        var (discountThreshold, discountPercentage) = await GetDiscountSettings(cancellationToken);
        var discount = subtotal >= discountThreshold ? decimal.Round(subtotal * discountPercentage / 100m, 2) : 0m;
        var total = subtotal - discount;
        var paymentMethod = StaffDtoMapper.ParsePaymentMethod(request.PaymentMethod);
        var status = paymentMethod == PaymentMethod.Credit || request.AddToCredit
            ? InvoiceStatus.Credit
            : InvoiceStatus.Paid;

        var invoice = new SalesInvoice
        {
            InvoiceNumber = $"INV-{DateTime.UtcNow:yyyy}-{DateTime.UtcNow:MMddHHmmssfff}",
            CustomerId = customer?.Id,
            WalkInName = NormalizeOptional(request.WalkInName),
            VehicleId = request.VehicleId,
            StaffId = actor.StaffId,
            StaffName = actor.Name,
            Status = status,
            PaymentMethod = paymentMethod,
            Subtotal = subtotal,
            Discount = discount,
            Total = total,
            Notes = NormalizeOptional(request.Notes)
        };

        var newLowStockParts = new List<Part>();

        foreach (var item in request.Items)
        {
            var part = parts[item.PartId];
            var stockBefore = part.StockQuantity;
            part.StockQuantity -= item.Quantity;
            part.Popularity += item.Quantity;
            part.UpdatedAt = DateTimeOffset.UtcNow;

            if (stockBefore > part.ReorderLevel && part.StockQuantity <= part.ReorderLevel)
            {
                newLowStockParts.Add(part);
            }

            invoice.Items.Add(new SalesInvoiceItem
            {
                PartId = part.Id,
                PartNumber = part.PartNumber,
                PartName = part.Name,
                Quantity = item.Quantity,
                UnitPrice = part.UnitPrice,
                Subtotal = part.UnitPrice * item.Quantity,
                StockBefore = stockBefore,
                StockAfter = part.StockQuantity
            });
        }

        if (customer is not null)
        {
            customer.TotalSpend += total;
            customer.VisitCount += 1;
            customer.LastVisit = DateTimeOffset.UtcNow;
            customer.LoyaltyPoints += (int)Math.Floor(total / 100m);

            if (status == InvoiceStatus.Credit)
            {
                customer.CreditBalance += total;
                invoice.CreditTransactions.Add(new CreditTransaction
                {
                    CustomerId = customer.Id,
                    Type = CreditTransactionType.Charge,
                    Amount = total,
                    BalanceAfter = customer.CreditBalance,
                    Notes = $"Charge for {invoice.InvoiceNumber}"
                });
            }
        }

        _dbContext.SalesInvoices.Add(invoice);
        AddLowStockNotifications(parts.Values);
        var lowStockEmailParts = await AddAdminLowStockNotifications(
            newLowStockParts,
            cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);
        await SendLowStockAlertEmails(lowStockEmailParts, cancellationToken);

        invoice.Customer = customer;
        if (request.VehicleId.HasValue)
        {
            invoice.Vehicle = await _dbContext.Vehicles
                .AsNoTracking()
                .SingleOrDefaultAsync(vehicle => vehicle.Id == request.VehicleId.Value, cancellationToken);
        }

        return StatusCode(StatusCodes.Status201Created, ToDetailDto(invoice));
    }

    private async Task<(Guid? StaffId, string Name)> GetActor(CancellationToken cancellationToken)
    {
        if (CurrentUserId is not { } userId)
        {
            return (null, "Staff");
        }

        var staff = await _dbContext.Staff
            .Include(item => item.User)
            .SingleOrDefaultAsync(item => item.UserId == userId, cancellationToken);

        if (staff is not null)
        {
            return (staff.Id, staff.User.FullName);
        }

        var userName = await _dbContext.Users
            .Where(user => user.Id == userId)
            .Select(user => user.FullName)
            .SingleOrDefaultAsync(cancellationToken);

        return (null, userName ?? "Staff");
    }

    private async Task<(decimal Threshold, decimal Percentage)> GetDiscountSettings(CancellationToken cancellationToken)
    {
        var settings = await _dbContext.AdminSettings
            .AsNoTracking()
            .Select(item => new { item.LoyaltyDiscountThreshold, item.LoyaltyDiscountPercentage })
            .FirstOrDefaultAsync(cancellationToken);

        return settings is null
            ? (5000m, 10m)
            : (settings.LoyaltyDiscountThreshold, settings.LoyaltyDiscountPercentage);
    }

    private void AddLowStockNotifications(IEnumerable<Models.Inventory.Part> parts)
    {
        foreach (var part in parts.Where(item => item.StockQuantity <= item.ReorderLevel))
        {
            _dbContext.UserNotifications.Add(new UserNotification
            {
                Audience = NotificationAudience.Staff,
                Type = UserNotificationType.LowStock,
                Title = $"{part.Name} needs restock",
                Message = $"{part.PartNumber ?? part.Name} has {part.StockQuantity} units left.",
                Link = "/notifications"
            });
        }
    }

    private async Task<IReadOnlyList<Part>> AddAdminLowStockNotifications(
        IEnumerable<Part> parts,
        CancellationToken cancellationToken)
    {
        var emailParts = new List<Part>();

        foreach (var part in parts)
        {
            var message = part.StockQuantity == 0
                ? $"{part.Name} is out of stock."
                : $"{part.Name} is below reorder level.";

            var alreadyExists = await _dbContext.AdminNotifications
                .AnyAsync(
                    notification => !notification.IsRead
                        && notification.Type == "low_stock"
                        && notification.Message == message,
                    cancellationToken);

            if (alreadyExists)
            {
                continue;
            }

            _dbContext.AdminNotifications.Add(new AdminNotification
            {
                Type = "low_stock",
                Message = message
            });
            emailParts.Add(part);
        }

        return emailParts;
    }

    private async Task SendLowStockAlertEmails(
        IEnumerable<Part> parts,
        CancellationToken cancellationToken)
    {
        foreach (var part in parts)
        {
            try
            {
                await _emailService.SendLowStockAlertAsync(
                    new LowStockAlertEmail(
                        part.Name,
                        part.PartNumber,
                        part.StockQuantity,
                        part.ReorderLevel,
                        null),
                    cancellationToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                _logger.LogError(
                    exception,
                    "Failed to send low-stock email for part {PartId}.",
                    part.Id);
            }
        }
    }

    private static StaffInvoiceDetailDto ToDetailDto(SalesInvoice invoice)
    {
        return new StaffInvoiceDetailDto(
            StaffDtoMapper.ToInvoiceDto(invoice),
            invoice.Items.Select(StaffDtoMapper.ToInvoiceItemDto).ToList(),
            invoice.Customer is null ? null : StaffDtoMapper.ToCustomerDto(invoice.Customer),
            invoice.Vehicle is null ? null : StaffDtoMapper.ToVehicleDto(invoice.Vehicle),
            invoice.StaffName,
            invoice.Notes);
    }
}
