namespace Backend.Models.Inventory;

public sealed class PartCategory
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Part> Parts { get; set; } = new List<Part>();
}
