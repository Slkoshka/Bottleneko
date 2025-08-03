using System.ComponentModel.DataAnnotations;
using Bottleneko.Database.Options;

namespace Bottleneko.Database.Schema;

public class OptionEntity
{
    [MaxLength(64)]
    [Key]
    public required string Key { get; set; }
    public required Option Value { get; set; }
}
