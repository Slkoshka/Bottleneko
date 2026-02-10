using System.Text.Json.Serialization;

namespace Bottleneko.Api.Dtos;

[JsonDerivedType(typeof(DiscordAttachmentDto), "Discord")]
[JsonDerivedType(typeof(TelegramAttachmentDto), "Telegram")]
[JsonDerivedType(typeof(TwitchAttachmentDto), "Twitch")]
public abstract record AttachmentDto
{
    public required long Id { get; init; }
    public required string? Name { get; init; }
    public required string ContentType { get; init; }
}

public record DiscordAttachmentDto : AttachmentDto
{
    public ulong DiscordId { get; init; }
    public required string? Title { get; init; }
    public required string? Description { get; init; }
    public required string Url { get; init; }
    public required string ProxyUrl { get; init; }
}

public record TelegramAttachmentDto : AttachmentDto
{
}

public record TwitchAttachmentDto : AttachmentDto
{
}
