using System.Text.Json.Serialization;
using Bottleneko.Database.Schema.Protocols.Discord;
using Bottleneko.Database.Schema.Protocols.Telegram;
using Bottleneko.Database.Schema.Protocols.Twitch;

namespace Bottleneko.Database.Schema.Protocols;

[JsonDerivedType(typeof(DiscordExtraProtocolData), "Discord")]
[JsonDerivedType(typeof(TelegramExtraProtocolData), "Telegram")]
[JsonDerivedType(typeof(TwitchExtraProtocolData), "Twitch")]
[SerializeAsJson]
public abstract record ExtraProtocolData();
