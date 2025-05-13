using Bottleneko.Api.Dtos;

namespace Bottleneko.Database.Schema;

public class ScriptEntity : NamedEntity
{
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string Description { get; set; }
    public required ScriptCode Code { get; set; }
    public bool AutoStart { get; set; } = true;
}
