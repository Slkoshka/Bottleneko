using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Api.Rpc.Services;
using Bottleneko.Messages;

namespace Bottleneko.Rpc.Services;

public class MessagesRpcService(IActorRef owner) : IMessagesService, IConnectionClosedListener
{
    private readonly SubscriptionManager _subscriptions = new();

    public void OnConnectionClosed(IRpcContext context)
    {
        if (context is RpcContext ctx)
        {
            _subscriptions.OnConnectionClosed(ctx.Connection);
        }
    }

    public async Task<SubscriptionId> SubscribeAsync(IRpcContext context, ChatMessageFilter filter)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext ctx:
                return await _subscriptions.SubscribeAsync(ctx.Connection, id => owner.Ask<IActorRef>(new RpcMessages.CreateMessagesSubscription(ctx.Connection, filter, id)));
        }
    }

    public void Unsubscribe(IRpcContext context, SubscriptionId subscriptionId)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext ctx:
                _subscriptions.Unsubscribe(ctx.Connection, subscriptionId);
                break;
        }
    }
}
