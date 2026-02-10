using Bottleneko.Database.Schema.Protocols.Discord;
using Bottleneko.Database.Schema.Protocols.Telegram;
using Bottleneko.Database.Schema.Protocols.Twitch;

namespace Bottleneko.Database.Schema;

public class ChatterEntity
{
    public long Id { get; set; }
    public required long ConnectionId { get; set; }
    [AutoInclude]
    public ConnectionEntity Connection { get; set; } = null!;
    public required string DisplayName { get; set; }
    public required string Username { get; set; }
    public required bool IsBot { get; set; }
    [AutoInclude]
    public DiscordChatterEntity? Discord { get; set; } = null;
    [AutoInclude]
    public TelegramChatterEntity? Telegram { get; set; } = null;
    [AutoInclude]
    public TwitchChatterEntity? Twitch { get; set; } = null;
}
