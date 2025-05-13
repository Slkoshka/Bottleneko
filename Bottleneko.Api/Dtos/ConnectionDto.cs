using Bottleneko.Api.Protocols;
using Bottleneko.Scripting;

namespace Bottleneko.Api.Dtos;

[ExposeToScripts]
public enum ConnectionStatus
{
    NotConnected,
    Connecting,
    Connected,
    Reconnecting,
    Stopping,

    Error,
}

[ExposeToScripts]
public enum Protocol
{
    Discord,
    Telegram,
    Twitch,
}

public record ConnectionDto(string Id, string Name, Protocol Protocol, bool AutoStart, ProtocolConfiguration Config, ConnectionStatus Status);
