using Microsoft.EntityFrameworkCore;

namespace Bottleneko.Database.Schema.Protocols.Discord;

[Index(nameof(ConnectionId), nameof(DiscordChannelId), nameof(DiscordGuildId), IsUnique = true)]
public class DiscordChatEntity
{
    public long Id { get; set; }
    public long ChatId { get; set; }
    public ChatEntity Chat { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;
    public required ulong? DiscordGuildId { get; set; }
    public required ulong DiscordChannelId { get; set; }
}

[Index(nameof(ConnectionId), nameof(DiscordUserId), IsUnique = true)]
public class DiscordChatterEntity
{
    public long Id { get; set; }
    public long ChatterId { get; set; }
    public ChatterEntity Chatter { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;
    public required ulong DiscordUserId { get; set; }
}

[Index(nameof(ConnectionId), nameof(DiscordAttachmentId), IsUnique = true)]
public class DiscordChatMessageAttachmentEntity
{
    public long Id { get; set; }
    public long ChatMessageAttachmentId { get; set; }
    public ChatMessageAttachmentEntity ChatMessageAttachment { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;
    public required ulong? DiscordGuildId { get; set; }
    public required ulong DiscordChannelId { get; set; }
    public required ulong DiscordAttachmentId { get; set; }
}

[Index(nameof(ConnectionId), nameof(DiscordMessageId), nameof(DiscordGuildId), nameof(DiscordChannelId), IsUnique = true)]
public class DiscordChatMessageEntity
{
    public long Id { get; set; }
    public long ChatMessageId { get; set; }
    public ChatMessageEntity ChatMessage { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;
    public required ulong? DiscordGuildId { get; set; }
    public required ulong DiscordChannelId { get; set; }
    public required ulong DiscordMessageId { get; set; }
}
