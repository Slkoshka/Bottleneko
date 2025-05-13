namespace Bottleneko.Api.Protocols;

public record DiscordProtocolConfiguration(string Token, bool ReceiveEvents, bool IsPresenceIntentEnabled = false, bool IsServerMembersIntentEnabled = false, bool IsMessageContentIntentEnabled = false) : ProtocolConfiguration;
