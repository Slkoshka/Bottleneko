using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Utils;

namespace Bottleneko.Messages;

public static class RpcMessages
{
    public record CreateRpcAdapter(Func<Packet, Task> SendCallback);
    public record PacketReceived(Packet Packet);

    public record GetEndPoint : SingletonMessage<GetEndPoint>;
    public record SendPacket(Packet Packet);
    public record HandleRequest(IRpcContext Context, RequestPacket Request);
    public record ConnectionClosed(IRpcContext Context);

    public record CreateMessagesSubscription(IActorRef Connection, ChatMessageFilter Filter, SubscriptionId SubscriptionId);
    public record CreateLogSubscription(IActorRef Connection, LogFilter Filter, SubscriptionId SubscriptionId);
}
