using System.Text.Json.Serialization;

namespace Bottleneko.Api.Dtos;

public record ChatSummaryDto(long Id, string DisplayName);

[JsonDerivedType(typeof(DiscordChatDto), "Discord")]
[JsonDerivedType(typeof(TelegramChatDto), "Telegram")]
[JsonDerivedType(typeof(TwitchChatDto), "Twitch")]
public abstract record ChatDto
{
    public required long Id { get; init; }
    public required long ConnectionId { get; init; }
    public required string DisplayName { get; init; }
    public required bool IsPrivate { get; init; }
}

public class DiscordGuild
{
    public required ulong DiscordId { get; init; }
    public required string Name { get; init; }
    public required string? Description { get; init; }
    public required ulong OwnerId { get; init; }
}

public enum DiscordChannelType
{
    Text,
    DM,
    Voice,
    Group,
    Category,
    News,
    Store,
    NewsThread,
    PublicThread,
    PrivateThread,
    Stage,
    GuildDirectory,
    Forum,
    Media,
}

public class DiscordChannel
{
    public required ulong DiscordId { get; init; }
    public required string Name { get; init; }
    public required DiscordChannelType Type { get; init; }
}

public record DiscordChatDto : ChatDto
{
    public required DiscordGuild? Guild { get; init; }
    public required DiscordChannel Channel { get; init; }
}

public enum TelegramChatType
{
    Private,
    Group,
    Channel,
    Supergroup,
    Sender,
}

public record TelegramChatDto : ChatDto
{
    public long TelegramId { get; init; }
    public required TelegramChatType Type { get; init; }
    public required string? Title { get; init; }
    public required string? FirstName { get; init; }
    public required string? LastName { get; init; }
    public required bool IsForum { get; init; }
}

public record TwitchChatDto : ChatDto
{
    public required string TwitchId { get; init; }
    public required string Name { get; init; }
    public required bool IsWhisper { get; init; }
}
