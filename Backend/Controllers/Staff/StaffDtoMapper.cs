using Backend.DTOs.Staff;
using Backend.Models.Credits;
using Backend.Models.Inventory;
using Backend.Models.Notifications;
using Backend.Models.Sales;
using Backend.Models.Users;
using Backend.Models.Vehicles;

namespace Backend.Controllers.Staff;

internal static class StaffDtoMapper
{
    public static StaffDto ToStaffDto(Backend.Models.Users.Staff staff)
    {
        return new StaffDto(
            staff.Id,
            staff.User.FullName,
            staff.User.Email,
            staff.StaffRole == StaffRole.Manager ? "Manager" : "Sales Staff",
            null);
    }

    public static StaffCustomerDto ToCustomerDto(Backend.Models.Users.Customer customer)
    {
        return new StaffCustomerDto(
            customer.Id,
            customer.User.FullName,
            customer.Phone,
            customer.User.Email,
            customer.NidNumber,
            customer.DateOfBirth,
            customer.Address,
            customer.CreditLimit,
            customer.CreditBalance,
            customer.TotalSpend,
            customer.Vehicles.Count,
            customer.VisitCount,
            customer.LastVisit,
            customer.CreatedAt,
            customer.VisitCount >= 2);
    }

    public static StaffVehicleDto ToVehicleDto(Vehicle vehicle)
    {
        return new StaffVehicleDto(
            vehicle.Id,
            vehicle.CustomerId,
            vehicle.Make,
            vehicle.Model,
            vehicle.Year,
            vehicle.Plate,
            vehicle.Color,
            vehicle.FuelType?.ToString(),
            vehicle.EngineCc);
    }

    public static StaffPartDto ToPartDto(Part part)
    {
        return new StaffPartDto(
            part.Id,
            part.PartNumber ?? string.Empty,
            part.Name,
            part.UnitPrice,
            part.StockQuantity,
            part.ReorderLevel);
    }

    public static StaffInvoiceDto ToInvoiceDto(SalesInvoice invoice)
    {
        return new StaffInvoiceDto(
            invoice.Id,
            invoice.InvoiceNumber,
            invoice.CustomerId,
            invoice.WalkInName,
            invoice.VehicleId,
            invoice.StaffName,
            invoice.CreatedAt,
            ToInvoiceStatus(invoice.Status),
            ToPaymentMethod(invoice.PaymentMethod),
            invoice.Subtotal,
            invoice.Discount,
            invoice.Total,
            invoice.Notes);
    }

    public static StaffInvoiceSummaryDto ToInvoiceSummaryDto(SalesInvoice invoice)
    {
        return new StaffInvoiceSummaryDto(
            invoice.Id,
            invoice.InvoiceNumber,
            invoice.CustomerId,
            invoice.WalkInName,
            invoice.VehicleId,
            invoice.StaffName,
            invoice.CreatedAt,
            ToInvoiceStatus(invoice.Status),
            ToPaymentMethod(invoice.PaymentMethod),
            invoice.Subtotal,
            invoice.Discount,
            invoice.Total,
            invoice.Notes,
            invoice.Customer?.User.FullName ?? invoice.WalkInName ?? "Walk-in Customer",
            invoice.Vehicle?.Plate);
    }

    public static StaffInvoiceItemDto ToInvoiceItemDto(SalesInvoiceItem item)
    {
        return new StaffInvoiceItemDto(
            item.Id,
            item.PartId,
            item.PartNumber ?? string.Empty,
            item.PartName,
            item.Quantity,
            item.UnitPrice,
            item.Subtotal);
    }

    public static StaffCreditTransactionDto ToCreditTransactionDto(CreditTransaction transaction)
    {
        return new StaffCreditTransactionDto(
            transaction.Id,
            transaction.CustomerId,
            transaction.Date,
            transaction.Type == CreditTransactionType.Payment ? "payment" : "charge",
            transaction.Notes,
            transaction.SalesInvoiceId,
            transaction.Amount,
            transaction.BalanceAfter);
    }

    public static string ToNotificationType(UserNotificationType type)
    {
        return type switch
        {
            UserNotificationType.LowStock => "low_stock",
            UserNotificationType.OverdueCredit => "overdue_credit",
            UserNotificationType.Appointment => "appointment",
            _ => "info"
        };
    }

    public static string ToInvoiceStatus(InvoiceStatus status)
    {
        return status switch
        {
            InvoiceStatus.Credit => "credit",
            InvoiceStatus.Partial => "partial",
            _ => "paid"
        };
    }

    public static string ToPaymentMethod(PaymentMethod method)
    {
        return method switch
        {
            PaymentMethod.Cash => "cash",
            PaymentMethod.Credit => "credit",
            _ => "card"
        };
    }

    public static PaymentMethod ParsePaymentMethod(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "cash" => PaymentMethod.Cash,
            "credit" => PaymentMethod.Credit,
            _ => PaymentMethod.Card
        };
    }

    public static VehicleFuelType? ParseFuelType(string? fuelType)
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
}
