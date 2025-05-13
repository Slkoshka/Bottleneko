using Bottleneko.Database.Schema.Protocols.Discord;
using Bottleneko.Database.Schema.Protocols.Telegram;
using Bottleneko.Database.Schema.Protocols.Twitch;
using Microsoft.EntityFrameworkCore;

namespace Bottleneko.Database.Schema;

[Index(nameof(RemoteTimestamp), IsUnique = false, IsDescending = [true])]
public class ChatMessageEntity
{
    public long Id { get; set; }
    public required long ConnectionId { get; set; }
    [AutoInclude]
    public ConnectionEntity Connection { get; set; } = null!;
    // when the message was sent if this information is available, otherwise when the message was received by us
    public DateTime RemoteTimestamp { get; set; } = DateTime.UtcNow;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public long ChatId { get; set; }
    [AutoInclude]
    public ChatEntity Chat { get; set; } = null!;
    public long AuthorId { get; set; }
    [AutoInclude]
    public ChatterEntity Author { get; set; } = null!;
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string? TextContent { get; set; }
    [AutoInclude]
    public ICollection<ChatMessageAttachmentEntity> Attachments { get; set; } = [];
    // true if this isn't a normal message (e.g., a channel was created, a user was banned, etc.)
    public required bool IsSpecial { get; set; }
    // were we directly mentioned/replied to
    public required bool IsDirect { get; set; }
    // was this message sent when we were offline
    public required bool IsOffline { get; set; }
    public long? ReplyToId { get; set; } = null;
    public ChatMessageEntity? ReplyTo { get; set; } = null;
    public DiscordChatMessageEntity? Discord { get; set; } = null;
    public TelegramChatMessageEntity? Telegram { get; set; } = null;
    public TwitchChatMessageEntity? Twitch { get; set; } = null;
}
