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

    public required string TwitchId { get; set; }
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

    public required string TwitchId { get; set; }
    public required string TwitchName { get; set; }
}

[Index(nameof(TwitchChatMessageId), IsUnique = false)]
public class TwitchChatBadgeEntity
{
    public long Id { get; set; }
    public long TwitchChatMessageId { get; set; }
    public TwitchChatMessageEntity TwitchChatMessage { get; set; } = null!;

    public required string TwitchId { get; set; }
    public required string Info { get; set; }
    public required string TwitchSetId { get; set; }
}

[Index(nameof(ConnectionId), nameof(TwitchChatId), nameof(TwitchId), nameof(IsWhisper), IsUnique = true)]
public class TwitchChatMessageEntity
{
    public long Id { get; set; }
    public long ChatMessageId { get; set; }
    public ChatMessageEntity ChatMessage { get; set; } = null!;
    public long ConnectionId { get; set; }
    public ConnectionEntity Connection { get; set; } = null!;

    public required string TwitchId { get; set; }
    public required string TwitchChatId { get; set; }
    public required bool IsWhisper { get; set; }
    [AutoInclude]
    public ICollection<TwitchChatBadgeEntity> Badges { get; set; } = [];
    public required string? Color;
    public required int? CheerBits { get; set; }
    public required string? ChannelPointsCustomRewardId { get; set; }
    public required bool? IsSubscriber { get; set; }
    public required bool? IsModerator { get; set; }
    public required bool? IsBroadcaster { get; set; }
    public required bool? IsVip { get; set; }
    public required bool? IsStaff { get; set; }
}

