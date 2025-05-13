namespace Bottleneko.Database.Schema.Protocols.Twitch;

public record TwitchExtraProtocolData(string StartingAccessToken, string StartingRefreshToken, string CurrentAccessToken, string CurrentRefreshToken) : ExtraProtocolData;
