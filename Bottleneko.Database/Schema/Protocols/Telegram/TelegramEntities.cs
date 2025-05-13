using Microsoft.EntityFrameworkCore;

namespace Bottleneko.Database.Schema.Protocols.Telegram;

[Index(nameof(ConnectionId), nameof(TelegramId), IsUnique = true)]
public class TelegramChatEntity
{
    public long Id { get; set; }
    public long ChatId { get; set; }
    public ChatEntity Chat { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;
    public required long TelegramId { get; set; }
}

[Index(nameof(ConnectionId), nameof(TelegramId), IsUnique = true)]
public class TelegramChatterEntity
{
    public long Id { get; set; }
    public long ChatterId { get; set; }
    public ChatterEntity Chatter { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;
    public required long TelegramId { get; set; }
}

public enum TelegramChatMessageAttachmentType
{
    Animation,
    Audio,
    Document,
    Photo,
    Video,
    VideoNote,
    Voice,
}

[Index(nameof(ConnectionId), nameof(TelegramMessageId), nameof(TelegramChatId), IsUnique = false)]
[Index(nameof(ConnectionId), nameof(TelegramAttachmentType), nameof(TelegramChatId), nameof(TelegramMessageId), IsUnique = true)]
public class TelegramChatMessageAttachmentEntity
{
    public long Id { get; set; }
    public long ChatMessageAttachmentId { get; set; }
    public ChatMessageAttachmentEntity ChatMessageAttachment { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;
    public required TelegramChatMessageAttachmentType TelegramAttachmentType { get; set; }
    public required long TelegramChatId { get; set; }
    public required long TelegramMessageId { get; set; }
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string TelegramFileId { get; set; }
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string TelegramFileUniqueId { get; set; }
}

[Index(nameof(ConnectionId), nameof(TelegramId), nameof(TelegramChatId), IsUnique = true)]
public class TelegramChatMessageEntity
{
    public long Id { get; set; }
    public long ChatMessageId { get; set; }
    public ChatMessageEntity ChatMessage { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;
    public required long TelegramChatId { get; set; }
    public required long TelegramId { get; set; }
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string? TelegramMediaGroupId { get; set; }
}
