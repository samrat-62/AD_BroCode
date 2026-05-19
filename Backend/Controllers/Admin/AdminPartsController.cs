using Backend.Data;
using Backend.DTOs.Admin.Parts;
using Backend.Models.Admin;
using Backend.Models.Inventory;
using Backend.Services.Email;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.Controllers.Admin;

public sealed class AdminPartsController : AdminControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IEmailService _emailService;
    private readonly ILogger<AdminPartsController> _logger;

    public AdminPartsController(
        ApplicationDbContext dbContext,
        IEmailService emailService,
        ILogger<AdminPartsController> logger)
    {
        _dbContext = dbContext;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpGet("parts")]
    public async Task<ActionResult<AdminPartsListResponseDto>> ListParts(
        [FromQuery] string? search,
        [FromQuery] Guid? categoryId,
        [FromQuery] string? stockStatus,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 15,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        limit = Math.Clamp(limit, 1, 200);

        var query = _dbContext.Parts
            .Include(part => part.Category)
            .Include(part => part.Vendor)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(part =>
                part.Name.ToLower().Contains(term)
                || (part.PartNumber != null && part.PartNumber.ToLower().Contains(term))
                || part.Category.Name.ToLower().Contains(term));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(part => part.CategoryId == categoryId.Value);
        }

        query = stockStatus?.Trim().ToLowerInvariant() switch
        {
            "in_stock" => query.Where(part => part.StockQuantity > part.ReorderLevel),
            "low_stock" => query.Where(part => part.StockQuantity > 0 && part.StockQuantity <= part.ReorderLevel),
            "out_of_stock" => query.Where(part => part.StockQuantity == 0),
            _ => query
        };

        var total = await query.CountAsync(cancellationToken);
        var lowStockCount = await _dbContext.Parts
            .CountAsync(part => part.StockQuantity <= part.ReorderLevel, cancellationToken);
        var data = await query
            .OrderBy(part => part.Name)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(part => ToDto(part))
            .ToListAsync(cancellationToken);

        return Ok(new AdminPartsListResponseDto(
            data,
            total,
            page,
            limit,
            ToTotalPages(total, limit),
            lowStockCount));
    }

    [HttpPost("parts")]
    public async Task<ActionResult<AdminPartDto>> CreatePart(
        UpsertAdminPartRequestDto request,
        CancellationToken cancellationToken)
    {
        var categoryExists = await _dbContext.PartCategories
            .AnyAsync(category => category.Id == request.CategoryId, cancellationToken);

        if (!categoryExists)
        {
            return BadRequest(new { message = "Category was not found." });
        }

        if (request.VendorId == Guid.Empty)
        {
            return BadRequest(new { message = "Vendor is required." });
        }

        var vendorExists = await _dbContext.Vendors
            .AnyAsync(vendor => vendor.Id == request.VendorId, cancellationToken);

        if (!vendorExists)
        {
            return BadRequest(new { message = "Vendor was not found." });
        }

        var part = new Part
        {
            Name = request.Name.Trim(),
            PartNumber = NormalizeOptional(request.PartNumber),
            CategoryId = request.CategoryId,
            Description = NormalizeOptional(request.Description),
            UnitPrice = request.UnitPrice,
            StockQuantity = request.StockQuantity,
            ReorderLevel = request.ReorderLevel,
            VendorId = request.VendorId
        };

        _dbContext.Parts.Add(part);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return Conflict(new { message = "Part number already exists." });
        }

        await _dbContext.Entry(part).Reference(item => item.Category).LoadAsync(cancellationToken);
        await _dbContext.Entry(part).Reference(item => item.Vendor).LoadAsync(cancellationToken);

        await CreateLowStockNotificationIfNeeded(part, cancellationToken);

        return CreatedAtAction(nameof(ListParts), new { id = part.Id }, ToDto(part));
    }

    [HttpPut("parts/{id:guid}")]
    public async Task<ActionResult<AdminPartDto>> UpdatePart(
        Guid id,
        UpsertAdminPartRequestDto request,
        CancellationToken cancellationToken)
    {
        var part = await _dbContext.Parts
            .Include(part => part.Category)
            .Include(part => part.Vendor)
            .SingleOrDefaultAsync(part => part.Id == id, cancellationToken);

        if (part is null)
        {
            return NotFound(new { message = "Part was not found." });
        }

        var categoryExists = await _dbContext.PartCategories
            .AnyAsync(category => category.Id == request.CategoryId, cancellationToken);

        if (!categoryExists)
        {
            return BadRequest(new { message = "Category was not found." });
        }

        if (request.VendorId == Guid.Empty)
        {
            return BadRequest(new { message = "Vendor is required." });
        }

        var vendorExists = await _dbContext.Vendors
            .AnyAsync(vendor => vendor.Id == request.VendorId, cancellationToken);

        if (!vendorExists)
        {
            return BadRequest(new { message = "Vendor was not found." });
        }

        part.Name = request.Name.Trim();
        part.PartNumber = NormalizeOptional(request.PartNumber);
        part.CategoryId = request.CategoryId;
        part.Description = NormalizeOptional(request.Description);
        part.UnitPrice = request.UnitPrice;
        part.StockQuantity = request.StockQuantity;
        part.ReorderLevel = request.ReorderLevel;
        part.VendorId = request.VendorId;
        part.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return Conflict(new { message = "Part number already exists." });
        }

        await _dbContext.Entry(part).Reference(item => item.Category).LoadAsync(cancellationToken);
        await _dbContext.Entry(part).Reference(item => item.Vendor).LoadAsync(cancellationToken);
        await CreateLowStockNotificationIfNeeded(part, cancellationToken);

        return Ok(ToDto(part));
    }

    [HttpDelete("parts/{id:guid}")]
    public async Task<IActionResult> DeletePart(Guid id, CancellationToken cancellationToken)
    {
        var part = await _dbContext.Parts.SingleOrDefaultAsync(part => part.Id == id, cancellationToken);

        if (part is null)
        {
            return NotFound(new { message = "Part was not found." });
        }

        _dbContext.Parts.Remove(part);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("parts/categories")]
    public async Task<ActionResult<IReadOnlyList<AdminPartCategoryDto>>> ListCategories(
        CancellationToken cancellationToken)
    {
        var categories = await _dbContext.PartCategories
            .AsNoTracking()
            .OrderBy(category => category.Name)
            .Select(category => new AdminPartCategoryDto(category.Id, category.Name))
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }

    [HttpPost("parts/categories")]
    public async Task<ActionResult<AdminPartCategoryDto>> CreateCategory(
        CreatePartCategoryRequestDto request,
        CancellationToken cancellationToken)
    {
        var category = new PartCategory
        {
            Name = request.Name.Trim()
        };

        _dbContext.PartCategories.Add(category);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return Conflict(new { message = "Category already exists." });
        }

        return StatusCode(
            StatusCodes.Status201Created,
            new AdminPartCategoryDto(category.Id, category.Name));
    }

    [HttpDelete("parts/categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken cancellationToken)
    {
        var category = await _dbContext.PartCategories
            .SingleOrDefaultAsync(category => category.Id == id, cancellationToken);

        if (category is null)
        {
            return NotFound(new { message = "Category was not found." });
        }

        var hasParts = await _dbContext.Parts
            .AnyAsync(part => part.CategoryId == id, cancellationToken);

        if (hasParts)
        {
            return Conflict(new { message = "Category cannot be deleted while parts are assigned to it." });
        }

        _dbContext.PartCategories.Remove(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("parts/low-stock")]
    public async Task<ActionResult<IReadOnlyList<AdminLowStockPartDto>>> ListLowStock(
        CancellationToken cancellationToken)
    {
        var data = await _dbContext.Parts
            .Include(part => part.Category)
            .Include(part => part.Vendor)
            .AsNoTracking()
            .Where(part => part.StockQuantity <= part.ReorderLevel)
            .OrderBy(part => part.StockQuantity)
            .ThenBy(part => part.Name)
            .Select(part => new AdminLowStockPartDto(
                part.Id,
                part.Name,
                part.Category.Name,
                part.StockQuantity,
                part.ReorderLevel,
                part.Vendor != null ? part.Vendor.Name : null))
            .ToListAsync(cancellationToken);

        return Ok(data);
    }

    private async Task CreateLowStockNotificationIfNeeded(Part part, CancellationToken cancellationToken)
    {
        if (part.StockQuantity > part.ReorderLevel)
        {
            return;
        }

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
            return;
        }

        _dbContext.AdminNotifications.Add(new AdminNotification
        {
            Type = "low_stock",
            Message = message
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        await SendLowStockAlertEmail(part, cancellationToken);
    }

    private async Task SendLowStockAlertEmail(Part part, CancellationToken cancellationToken)
    {
        try
        {
            await _emailService.SendLowStockAlertAsync(
                new LowStockAlertEmail(
                    part.Name,
                    part.PartNumber,
                    part.StockQuantity,
                    part.ReorderLevel,
                    part.Vendor?.Name),
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

    private static AdminPartDto ToDto(Part part)
    {
        return new AdminPartDto(
            part.Id,
            part.Name,
            part.PartNumber,
            part.CategoryId,
            part.Category.Name,
            part.Description,
            part.UnitPrice,
            part.StockQuantity,
            part.ReorderLevel,
            part.VendorId,
            part.Vendor?.Name);
    }

    private static int ToTotalPages(int total, int limit)
    {
        return Math.Max(1, (int)Math.Ceiling(total / (double)limit));
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static bool IsUniqueViolation(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgresException
            && postgresException.SqlState == PostgresErrorCodes.UniqueViolation;
    }
}
