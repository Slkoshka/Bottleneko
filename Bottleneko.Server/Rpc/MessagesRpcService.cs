using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Rpc;
using Bottleneko.Server.Actors;

namespace Bottleneko.Server.Rpc;

class MessagesRpcService(IActorRef actor) : IMessagesService
{
    private readonly SubscriptionManager _subscriptions = new();

    public async Task<SubscriptionId> Subscribe(RpcContext context, ChatMessageFilter filter)
    {
        var apiRpcContext = context.Require<ApiRpcContext>();
        apiRpcContext.RequireAuthentication();

        return await _subscriptions.SubscribeAsync(apiRpcContext.Connection, id => actor.Ask<IActorRef>(new ApiCat.CreateMessagesSubscription(apiRpcContext.Connection, filter, id)));
    }

    public void Unsubscribe(RpcContext context, SubscriptionId subscriptionId)
    {
        var scriptRpcContext = context.Require<ApiRpcContext>();
        _subscriptions.Unsubscribe(scriptRpcContext.Connection, subscriptionId);
    }
}
