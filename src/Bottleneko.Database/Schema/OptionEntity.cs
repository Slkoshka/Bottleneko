using Bottleneko.Database.Options;
using System.ComponentModel.DataAnnotations;

namespace Bottleneko.Database.Schema;

public class OptionEntity
{
    [MaxLength(64)]
    [Key]
    public required string Key { get; set; }
    public required Option Value { get; set; }
}
