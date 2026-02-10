using System.Text.Json.Serialization;

namespace Bottleneko.Api.Dtos;

[JsonDerivedType(typeof(DiscordChatMessageDto), "Discord")]
[JsonDerivedType(typeof(TelegramChatMessageDto), "Telegram")]
[JsonDerivedType(typeof(WhisperTwitchChatMessageDto), "Twitch.Whisper")]
[JsonDerivedType(typeof(ChannelTwitchChatMessageDto), "Twitch.Channel")]
public abstract record ChatMessageDto
{
    public required long Id { get; init; }
    public required long ConnectionId { get; init; }
    public required DateTime Timestamp { get; init; }
    public required ChatSummaryDto Chat { get; init; }
    public required ChatterSummaryDto Author { get; init; }
    public required string? CustomAuthorName { get; init; }
    public required string? TextContent { get; init; }
    public required AttachmentDto[] Attachments { get; init; }
    public required bool IsSpecial { get; init; }
    public required bool IsDirect { get; init; }
    public required bool IsMissed { get; init; }
}

public record DiscordChatMessageDto : ChatMessageDto
{
    public required ulong DiscordId { get; init; }
    public required bool IsPinned { get; init; }
    public required bool IsEveryoneMentioned { get; init; }
    public required ulong[] ChannelMentions { get; init; }
    public required ulong[] RoleMentions { get; init; }
    public required ulong[] UserMentions { get; init; }
}

public record TelegramChatMessageDto : ChatMessageDto
{
}

public record TwitchChatBadge(string TwitchId, string Info, string SetId);

public abstract record TwitchChatMessageDto : ChatMessageDto
{
    public required string TwitchId { get; init; }
}

public record WhisperTwitchChatMessageDto : TwitchChatMessageDto
{
}

public record ChannelTwitchChatMessageDto : TwitchChatMessageDto
{
    public required TwitchChatBadge[] Badges { get; init; }
    public required string Color { get; init; }
    public required int? CheerBits { get; init; }
    public required string? ChannelPointsCustomRewardId { get; init; }
    public required bool IsSubscriber { get; init; }
    public required bool IsModerator { get; init; }
    public required bool IsBroadcaster { get; init; }
    public required bool IsVip { get; init; }
    public required bool IsStaff { get; init; }
}

