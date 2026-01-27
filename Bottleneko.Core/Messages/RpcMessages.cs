using Bottleneko.Api.Packets;
using Bottleneko.Utils;

namespace Bottleneko.Messages;

public static class RpcMessages
{
    public record GetEndPoint : SingletonMessage<GetEndPoint>;
    public record SendPacket(Packet Packet);
}
