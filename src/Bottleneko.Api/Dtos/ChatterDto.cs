using System.Text.Json.Serialization;

namespace Bottleneko.Api.Dtos;

public record ChatterSummaryDto
{
    public required long Id { get; init; }
    public required string DisplayName { get; init; }
    public required string Username { get; init; }
    public required bool IsBot { get; init; }
}

[JsonDerivedType(typeof(DiscordChatterDto), "Discord")]
[JsonDerivedType(typeof(TelegramChatterDto), "Telegram")]
[JsonDerivedType(typeof(TwitchChatterDto), "Twitch")]
public abstract record ChatterDto : ChatterSummaryDto
{
}

public record DiscordChatterDto : ChatterDto
{
    public required ulong DiscordId { get; init; }
    public required string? Discriminator { get; init; }
}

public record TelegramChatterDto : ChatterDto
{
    public required long TelegramId { get; init; }
    public required string FirstName { get; init; }
    public required string? LastName { get; init; }
    public required string? LanguageCode { get; init; }
    public required bool HasPremium { get; init; }
    public required bool AddedToAttachmentMenu { get; init; }
}

public record TwitchChatterDto : ChatterDto
{
    public required string TwitchId { get; init; }
}
