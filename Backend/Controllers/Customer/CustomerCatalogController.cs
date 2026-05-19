using Backend.Data;
using Backend.DTOs.Customer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Customer;

[AllowAnonymous]
[Route("api")]
public sealed class CustomerCatalogController : CustomerControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public CustomerCatalogController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("parts")]
    public async Task<ActionResult<IReadOnlyList<PartDto>>> ListParts(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] bool? inStock,
        [FromQuery] string? sort,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Parts
            .Include(part => part.Category)
            .AsNoTracking()
            .Where(part => part.IsActive);

        if (!string.IsNullOrWhiteSpace(category))
        {
            var categoryTerm = category.Trim().ToLowerInvariant();
            query = query.Where(part => part.Category.Name.ToLower() == categoryTerm);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(part =>
                part.Name.ToLower().Contains(term) ||
                (part.PartNumber != null && part.PartNumber.ToLower().Contains(term)) ||
                (part.Description != null && part.Description.ToLower().Contains(term)));
        }

        if (minPrice.HasValue)
        {
            query = query.Where(part => part.UnitPrice >= minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(part => part.UnitPrice <= maxPrice.Value);
        }

        if (inStock == true)
        {
            query = query.Where(part => part.StockQuantity > 0);
        }

        query = sort?.Trim().ToLowerInvariant() switch
        {
            "price-asc" => query.OrderBy(part => part.UnitPrice),
            "price-desc" => query.OrderByDescending(part => part.UnitPrice),
            "newest" => query.OrderByDescending(part => part.CreatedAt),
            _ => query.OrderByDescending(part => part.Popularity).ThenBy(part => part.Name)
        };

        var parts = await query
            .Select(part => new PartDto(
                part.Id,
                part.Name,
                part.Category.Name,
                part.UnitPrice,
                part.StockQuantity,
                part.Description,
                part.ImageUrl,
                part.PartNumber,
                part.CompatibleModels,
                part.Popularity,
                part.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(parts);
    }

    [HttpGet("parts/categories")]
    public async Task<ActionResult<IReadOnlyList<PartCategoryDto>>> ListPartCategories(
        CancellationToken cancellationToken)
    {
        var categories = await _dbContext.PartCategories
            .AsNoTracking()
            .OrderBy(category => category.Name)
            .Select(category => new PartCategoryDto(
                category.Name,
                category.Parts.Count(part => part.IsActive)))
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }

    [HttpGet("parts/{id:guid}")]
    public async Task<ActionResult<PartDto>> GetPart(Guid id, CancellationToken cancellationToken)
    {
        var part = await _dbContext.Parts
            .Include(item => item.Category)
            .AsNoTracking()
            .Where(item => item.Id == id && item.IsActive)
            .Select(item => new PartDto(
                item.Id,
                item.Name,
                item.Category.Name,
                item.UnitPrice,
                item.StockQuantity,
                item.Description,
                item.ImageUrl,
                item.PartNumber,
                item.CompatibleModels,
                item.Popularity,
                item.CreatedAt))
            .SingleOrDefaultAsync(cancellationToken);

        if (part is null)
        {
            return NotFound(new { message = "Part was not found." });
        }

        return Ok(part);
    }
}
