namespace Bottleneko.Api.Packets;

public record AuthenticatePacket(string AccessToken) : Packet;
