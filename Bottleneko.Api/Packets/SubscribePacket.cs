namespace Bottleneko.Api.Packets;

public record SubscribePacket(string Id, SubscriptionTopic Topic, string? BeforeId) : Packet;
