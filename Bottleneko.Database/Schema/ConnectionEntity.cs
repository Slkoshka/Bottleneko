using System.ComponentModel.DataAnnotations;
using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Database.Schema.Protocols;

namespace Bottleneko.Database.Schema;

public class ConnectionEntity : NamedEntity
{
    [MaxLength(32)]
    public required Protocol Protocol { get; set; }
    public bool AutoStart { get; set; } = true;
    public required ProtocolConfiguration Configuration { get; set; }
    public ExtraProtocolData? Extra { get; set; }
}
