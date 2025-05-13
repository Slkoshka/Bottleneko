using Bottleneko.Database.Schema.Protocols.Discord;
using Bottleneko.Database.Schema.Protocols.Telegram;
using Bottleneko.Database.Schema.Protocols.Twitch;

namespace Bottleneko.Database.Schema;

public class ChatEntity
{
    public long Id { get; set; }
    public required long ConnectionId { get; set; }
    [AutoInclude]
    public ConnectionEntity Connection { get; set; } = null!;
    public required bool IsPrivate { get; set; }
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string DisplayName { get; set; }
    public DiscordChatEntity? Discord { get; set; } = null;
    public TelegramChatEntity? Telegram { get; set; } = null;
    public TwitchChatEntity? Twitch { get; set; } = null;
}
