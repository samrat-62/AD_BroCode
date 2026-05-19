using Backend.Data;
using Backend.DTOs.Staff;
using Backend.Models.Customers;
using Backend.Models.Users;
using Backend.Models.Vehicles;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.Controllers.Staff;

public sealed class StaffCustomersController : StaffControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public StaffCustomersController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("customers")]
    public async Task<ActionResult<IReadOnlyList<StaffCustomerDto>>> ListCustomers(
        [FromQuery] string? search,
        [FromQuery] bool? hasCredit,
        [FromQuery] bool? regular,
        CancellationToken cancellationToken)
    {
        var query = BaseCustomerQuery();

        if (hasCredit == true)
        {
            query = query.Where(customer => customer.CreditBalance > 0);
        }

        if (regular == true)
        {
            query = query.Where(customer => customer.VisitCount >= 2);
        }

        query = ApplyCustomerSearch(query, search);

        var customers = await query
            .OrderBy(customer => customer.User.FullName)
            .ToListAsync(cancellationToken);

        return Ok(customers.Select(StaffDtoMapper.ToCustomerDto).ToList());
    }

    [HttpGet("customers/search")]
    public async Task<ActionResult<IReadOnlyList<StaffCustomerDto>>> SearchCustomers(
        [FromQuery] string? mode,
        [FromQuery] string? q,
        CancellationToken cancellationToken)
    {
        var query = BaseCustomerQuery();
        var term = q?.Trim().ToLowerInvariant();

        if (!string.IsNullOrWhiteSpace(term))
        {
            query = mode?.Trim().ToLowerInvariant() switch
            {
                "phone" => query.Where(customer => customer.Phone.ToLower().Contains(term)),
                "id" => query.Where(customer =>
                    customer.Id.ToString().ToLower().Contains(term) ||
                    (customer.NidNumber != null && customer.NidNumber.ToLower().Contains(term))),
                "plate" => query.Where(customer =>
                    customer.Vehicles.Any(vehicle => vehicle.Plate.ToLower().Contains(term))),
                _ => query.Where(customer =>
                    customer.User.FullName.ToLower().Contains(term) ||
                    customer.Phone.ToLower().Contains(term) ||
                    customer.User.Email.ToLower().Contains(term) ||
                    customer.Id.ToString().ToLower().Contains(term))
            };
        }

        var customers = await query
            .OrderBy(customer => customer.User.FullName)
            .Take(25)
            .ToListAsync(cancellationToken);

        return Ok(customers.Select(StaffDtoMapper.ToCustomerDto).ToList());
    }

    [HttpPost("customers")]
    public async Task<ActionResult<StaffCustomerDto>> CreateCustomer(
        CreateStaffCustomerRequestDto request,
        CancellationToken cancellationToken)
    {
        var email = string.IsNullOrWhiteSpace(request.Email)
            ? $"customer-{Guid.NewGuid():N}@local.autoparts"
            : request.Email.Trim().ToLowerInvariant();

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
            Role = UserRole.Customer,
            IsActive = true
        };

        var customer = new Backend.Models.Users.Customer
        {
            User = user,
            Phone = request.Phone.Trim(),
            Address = NormalizeOptional(request.Address),
            DateOfBirth = request.Dob,
            NidNumber = NormalizeOptional(request.Nid),
            CreditLimit = request.CreditLimit ?? 0m,
            NotificationSettings = new CustomerNotificationSettings()
        };

        foreach (var vehicleRequest in request.Vehicles ?? Array.Empty<CreateStaffVehicleRequestDto>())
        {
            customer.Vehicles.Add(new Vehicle
            {
                Make = vehicleRequest.Make.Trim(),
                Model = vehicleRequest.Model.Trim(),
                Year = vehicleRequest.Year,
                Plate = vehicleRequest.Plate.Trim().ToUpperInvariant(),
                Color = NormalizeOptional(vehicleRequest.Color),
                FuelType = StaffDtoMapper.ParseFuelType(vehicleRequest.FuelType),
                EngineCc = vehicleRequest.EngineCc
            });
        }

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            customer.Notes.Add(new CustomerNote
            {
                AuthorUserId = CurrentUserId,
                Body = request.Notes.Trim()
            });
        }

        _dbContext.Customers.Add(customer);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return Conflict(new { message = "Customer email or vehicle plate already exists." });
        }

        await _dbContext.Entry(customer).Reference(item => item.User).LoadAsync(cancellationToken);
        await _dbContext.Entry(customer).Collection(item => item.Vehicles).LoadAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, StaffDtoMapper.ToCustomerDto(customer));
    }

    [HttpGet("customers/{id:guid}")]
    public async Task<ActionResult<StaffCustomerProfileDto>> GetCustomer(
        Guid id,
        CancellationToken cancellationToken)
    {
        var customer = await BaseCustomerQuery()
            .SingleOrDefaultAsync(customer => customer.Id == id, cancellationToken);

        if (customer is null)
        {
            return NotFound(new { message = "Customer was not found." });
        }

        return Ok(new StaffCustomerProfileDto(
            StaffDtoMapper.ToCustomerDto(customer),
            customer.TotalSpend,
            customer.CreatedAt));
    }

    [HttpGet("customers/{id:guid}/vehicles")]
    public async Task<ActionResult<IReadOnlyList<StaffVehicleDto>>> GetCustomerVehicles(
        Guid id,
        CancellationToken cancellationToken)
    {
        var vehicles = await _dbContext.Vehicles
            .AsNoTracking()
            .Where(vehicle => vehicle.CustomerId == id)
            .OrderBy(vehicle => vehicle.Plate)
            .Select(vehicle => StaffDtoMapper.ToVehicleDto(vehicle))
            .ToListAsync(cancellationToken);

        return Ok(vehicles);
    }

    [HttpGet("customers/{id:guid}/purchases")]
    public async Task<ActionResult<IReadOnlyList<StaffCustomerPurchaseDto>>> GetCustomerPurchases(
        Guid id,
        CancellationToken cancellationToken)
    {
        var invoices = await _dbContext.SalesInvoices
            .Include(invoice => invoice.Customer)
            .ThenInclude(customer => customer!.User)
            .Include(invoice => invoice.Vehicle)
            .AsNoTracking()
            .Where(invoice => invoice.CustomerId == id)
            .OrderByDescending(invoice => invoice.CreatedAt)
            .ToListAsync(cancellationToken);

        var orders = await _dbContext.Orders
            .Include(order => order.Customer)
            .ThenInclude(customer => customer.User)
            .AsNoTracking()
            .Where(order => order.CustomerId == id)
            .OrderByDescending(order => order.CreatedAt)
            .ToListAsync(cancellationToken);

        var purchases = invoices
            .Select(invoice => new StaffCustomerPurchaseDto(
                invoice.Id,
                "invoice",
                invoice.InvoiceNumber,
                StaffDtoMapper.ToInvoiceStatus(invoice.Status),
                StaffDtoMapper.ToPaymentMethod(invoice.PaymentMethod),
                invoice.Total,
                invoice.CreatedAt,
                invoice.StaffName,
                invoice.Vehicle?.Plate))
            .Concat(orders.Select(order => new StaffCustomerPurchaseDto(
                order.Id,
                "order",
                order.OrderNumber,
                StaffOrdersController.ToStatusString(order.Status),
                StaffOrdersController.ToPaymentMethodString(order.PaymentMethod),
                order.Total,
                order.CreatedAt,
                "Customer Portal",
                null)))
            .OrderByDescending(purchase => purchase.CreatedAt)
            .ToList();

        return Ok(purchases);
    }

    [HttpGet("customers/{id:guid}/services")]
    public async Task<ActionResult<IReadOnlyList<StaffServiceRecordDto>>> GetCustomerServices(
        Guid id,
        CancellationToken cancellationToken)
    {
        var services = await _dbContext.ServiceRecords
            .AsNoTracking()
            .Where(record => record.CustomerId == id)
            .OrderByDescending(record => record.Date)
            .Select(record => new StaffServiceRecordDto(
                record.Id,
                record.CustomerId,
                record.Date,
                record.ServiceType,
                record.Technician,
                record.Cost))
            .ToListAsync(cancellationToken);

        return Ok(services);
    }

    [HttpGet("customers/{id:guid}/credit")]
    public async Task<ActionResult<object>> GetCustomerCredit(
        Guid id,
        CancellationToken cancellationToken)
    {
        var transactions = await _dbContext.CreditTransactions
            .AsNoTracking()
            .Where(transaction => transaction.CustomerId == id)
            .OrderByDescending(transaction => transaction.Date)
            .Select(transaction => StaffDtoMapper.ToCreditTransactionDto(transaction))
            .ToListAsync(cancellationToken);

        return Ok(new { transactions });
    }

    [HttpGet("customers/{id:guid}/notes")]
    public async Task<ActionResult<IReadOnlyList<StaffCustomerNoteDto>>> GetCustomerNotes(
        Guid id,
        CancellationToken cancellationToken)
    {
        var notes = await _dbContext.CustomerNotes
            .Include(note => note.AuthorUser)
            .AsNoTracking()
            .Where(note => note.CustomerId == id)
            .OrderByDescending(note => note.CreatedAt)
            .Select(note => new StaffCustomerNoteDto(
                note.Id,
                note.CustomerId,
                note.Body,
                note.AuthorUser == null ? "Staff" : note.AuthorUser.FullName,
                note.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(notes);
    }

    [HttpPost("customers/{id:guid}/notes")]
    public async Task<ActionResult<StaffCustomerNoteDto>> AddCustomerNote(
        Guid id,
        AddStaffCustomerNoteRequestDto request,
        CancellationToken cancellationToken)
    {
        var customerExists = await _dbContext.Customers
            .AnyAsync(customer => customer.Id == id, cancellationToken);

        if (!customerExists)
        {
            return NotFound(new { message = "Customer was not found." });
        }

        var note = new CustomerNote
        {
            CustomerId = id,
            AuthorUserId = CurrentUserId,
            Body = request.Body.Trim()
        };

        _dbContext.CustomerNotes.Add(note);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var author = await _dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == CurrentUserId)
            .Select(user => user.FullName)
            .SingleOrDefaultAsync(cancellationToken) ?? "Staff";

        return StatusCode(
            StatusCodes.Status201Created,
            new StaffCustomerNoteDto(note.Id, note.CustomerId, note.Body, author, note.CreatedAt));
    }

    private IQueryable<Backend.Models.Users.Customer> BaseCustomerQuery()
    {
        return _dbContext.Customers
            .Include(customer => customer.User)
            .Include(customer => customer.Vehicles)
            .AsNoTracking();
    }

    private static IQueryable<Backend.Models.Users.Customer> ApplyCustomerSearch(
        IQueryable<Backend.Models.Users.Customer> query,
        string? search)
    {
        if (string.IsNullOrWhiteSpace(search))
        {
            return query;
        }

        var term = search.Trim().ToLowerInvariant();

        return query.Where(customer =>
            customer.User.FullName.ToLower().Contains(term) ||
            customer.Phone.ToLower().Contains(term) ||
            customer.User.Email.ToLower().Contains(term) ||
            customer.Id.ToString().ToLower().Contains(term) ||
            (customer.NidNumber != null && customer.NidNumber.ToLower().Contains(term)) ||
            customer.Vehicles.Any(vehicle => vehicle.Plate.ToLower().Contains(term)));
    }

    private static bool IsUniqueViolation(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgresException
            && postgresException.SqlState == PostgresErrorCodes.UniqueViolation;
    }
}
