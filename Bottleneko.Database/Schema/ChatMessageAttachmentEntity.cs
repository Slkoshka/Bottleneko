using System.ComponentModel.DataAnnotations;
using Bottleneko.Database.Schema.Protocols.Discord;
using Bottleneko.Database.Schema.Protocols.Telegram;

namespace Bottleneko.Database.Schema;

public class ChatMessageAttachmentEntity
{
    public long Id { get; set; }
    public required long ConnectionId { get; set; }
    [AutoInclude]
    public ConnectionEntity Connection { get; set; } = null!;
    public long MessageId { get; set; }
    [AutoInclude]
    public ChatMessageEntity Message { get; set; } = null!;
    [MaxLength(64)]
    public required string ContentType { get; set; }
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public string? FileName { get; set; }
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public string? Url { get; set; }
    public DiscordChatMessageAttachmentEntity? Discord { get; set; } = null;
    public TelegramChatMessageAttachmentEntity? Telegram { get; set; } = null;
}
