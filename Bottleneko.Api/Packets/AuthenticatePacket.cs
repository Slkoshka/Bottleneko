namespace Bottleneko.Api.Packets;

public enum ClientType
{
    Api,
    Script,
}

public record AuthenticatePacket(ClientType ClientType, string AccessToken) : Packet;
