namespace Bottleneko.Api.Protocols;

public record TelegramProtocolConfiguration(string Token, bool ReceiveEvents, string? ProxyId = null) : ProtocolConfiguration;
