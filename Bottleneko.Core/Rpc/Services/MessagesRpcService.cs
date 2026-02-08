using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Rpc;
using Bottleneko.Api.Rpc.Services;
using Bottleneko.Messages;
using Bottleneko.Services;

namespace Bottleneko.Rpc.Services;

public class MessagesRpcService(AkkaService akka, IActorRef owner) : IMessagesService, IConnectionClosedListener
{
    private readonly SubscriptionManager _subscriptions = new();

    public void OnConnectionClosed(IRpcContext context)
    {
        if (context is RpcContext ctx)
        {
            _subscriptions.OnConnectionClosed(ctx.RpcConnection);
        }
    }

    public async Task<SubscriptionId> SubscribeAsync(IRpcContext context, ChatMessageFilter filter)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext ctx:
                return await _subscriptions.SubscribeAsync(ctx.RpcConnection, id => owner.Ask<IActorRef>(new RpcMessages.CreateMessagesSubscription(ctx.RpcConnection, filter, id)));
        }
    }

    public void Unsubscribe(IRpcContext context, SubscriptionId subscriptionId)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext ctx:
                _subscriptions.Unsubscribe(ctx.RpcConnection, subscriptionId);
                break;
        }
    }

    public async Task SendTextAsync(IRpcContext context, long connectionId, long chatId, string text, long? replyToMessageId)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
                akka.Tell(new ConnectionMessages.SendText(chatId, text, replyToMessageId).ToConnection(connectionId));
                break;
        }
    }
}
