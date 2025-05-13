using Microsoft.EntityFrameworkCore;

namespace Bottleneko.Database.Schema.Protocols.Twitch;

[Index(nameof(ConnectionId), nameof(TwitchId), nameof(IsWhisper), IsUnique = true)]
public class TwitchChatEntity
{
    public long Id { get; set; }
    public long ChatId { get; set; }
    public ChatEntity Chat { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string TwitchId { get; set; }
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string TwitchName { get; set; }
    public required bool IsWhisper { get; set; }
}

[Index(nameof(ConnectionId), nameof(TwitchId), IsUnique = true)]
public class TwitchChatterEntity
{
    public long Id { get; set; }
    public long ChatterId { get; set; }
    public ChatterEntity Chatter { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string TwitchId { get; set; }
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string TwitchName { get; set; }
}

[Index(nameof(ConnectionId), nameof(TwitchChatId), nameof(TwitchId), nameof(IsWhisper), IsUnique = true)]
public class TwitchChatMessageEntity
{
    public long Id { get; set; }
    public long ChatMessageId { get; set; }
    public ChatMessageEntity ChatMessage { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string TwitchChatId { get; set; }
    // ReSharper disable once EntityFramework.ModelValidation.UnlimitedStringLength
    public required string TwitchId { get; set; }
    public required bool IsWhisper { get; set; }
}

