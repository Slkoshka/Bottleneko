using System.Text.Json.Serialization;

namespace Bottleneko.Api.Protocols;

[JsonDerivedType(typeof(DiscordProtocolConfiguration), "Discord")]
[JsonDerivedType(typeof(TelegramProtocolConfiguration), "Telegram")]
[JsonDerivedType(typeof(TwitchProtocolConfiguration), "Twitch")]
[SerializeAsJson]
public abstract record ProtocolConfiguration();
