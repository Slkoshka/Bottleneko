namespace Bottleneko.Database;

public abstract class Entity
{
    public long Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
}

public abstract class NamedEntity : Entity
{
    public required string Name { get; set; }
}
