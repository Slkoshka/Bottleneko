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

public record ConnectionDto(string Id, string Name, Protocol Protocol, bool AutoStart, ProtocolConfiguration Config, ExtendedConnectionStatus ExtendedStatus);
