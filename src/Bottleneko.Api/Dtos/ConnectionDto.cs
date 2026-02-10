using System.Text.Json.Serialization;
using Bottleneko.Api.Protocols;

namespace Bottleneko.Api.Dtos;

public enum ConnectionStatus
{
    NotConnected,
    Connecting,
    Connected,
    Reconnecting,
    DelayedReconnect,
    Stopping,

    Error,
}

public enum Protocol
{
    Discord,
    Telegram,
    Twitch,
}

public record ExtendedConnectionStatus(ConnectionStatus Status, float StatusChangeDelay = 0.0f);

[JsonDerivedType(typeof(DiscordConnectionDto), "Discord")]
[JsonDerivedType(typeof(TelegramConnectionDto), "Telegram")]
[JsonDerivedType(typeof(TwitchConnectionDto), "Twitch")]
public abstract record ConnectionDto
{
    public required long Id { get; init; }
    public required string Name { get; init; }
    public required Protocol Protocol { get; init; }
    public required bool AutoStart { get; init; }
    public required ProtocolConfiguration Config { get; init; }
    public required ExtendedConnectionStatus ExtendedStatus { get; init; }
}

public record DiscordConnectionDto : ConnectionDto
{
}

public record TelegramConnectionDto : ConnectionDto
{
}

public record TwitchConnectionDto : ConnectionDto
{
}
