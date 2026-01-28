using Bottleneko.Api.Rpc;
using Bottleneko.Utils;

namespace Bottleneko.Messages;

public static class RpcMessages
{
    public record CreateRpcAdapter(Func<Packet, Task> SendCallback);
    public record PacketReceived(Packet Packet);

    public record GetEndPoint : SingletonMessage<GetEndPoint>;
    public record SendPacket(Packet Packet);
    public record HandleRequest(RpcContext Context, RequestPacket Request);
    public record ConnectionClosed(RpcContext Context);
}
