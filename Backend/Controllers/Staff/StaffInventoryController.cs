using Backend.Data;
using Backend.DTOs.Staff;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers.Staff;

public sealed class StaffInventoryController : StaffControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public StaffInventoryController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("parts")]
    public async Task<ActionResult<IReadOnlyList<StaffPartDto>>> ListParts(
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Parts
            .AsNoTracking()
            .Where(part => part.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(part =>
                part.Name.ToLower().Contains(term) ||
                (part.PartNumber != null && part.PartNumber.ToLower().Contains(term)));
        }

        var parts = await query
            .OrderBy(part => part.Name)
            .Select(part => StaffDtoMapper.ToPartDto(part))
            .ToListAsync(cancellationToken);

        return Ok(parts);
    }

    [HttpGet("parts/low-stock")]
    public async Task<ActionResult<IReadOnlyList<StaffPartDto>>> GetLowStockParts(
        CancellationToken cancellationToken)
    {
        var parts = await _dbContext.Parts
            .AsNoTracking()
            .Where(part => part.IsActive && part.StockQuantity <= part.ReorderLevel)
            .OrderBy(part => part.StockQuantity)
            .ThenBy(part => part.Name)
            .Select(part => StaffDtoMapper.ToPartDto(part))
            .ToListAsync(cancellationToken);

        return Ok(parts);
    }
}
