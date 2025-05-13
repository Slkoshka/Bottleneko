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
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string DisplayName { get; set; }
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string Username { get; set; }
    public required bool IsBot { get; set; }
    public DiscordChatterEntity? Discord { get; set; } = null;
    public TelegramChatterEntity? Telegram { get; set; } = null;
    public TwitchChatterEntity? Twitch { get; set; } = null;
}
