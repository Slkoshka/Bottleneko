using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Rpc;
using Bottleneko.Scripting.Deno;

namespace Bottleneko.Scripting.Rpc;

class MessagesRpcService(IActorRef actor) : IMessagesService, IConnectionClosedListener
{
    private readonly SubscriptionManager _subscriptions = new();

    public void OnConnectionClosed(RpcContext context)
    {
        if (context is ScriptRpcContext scriptRpcContext)
        {
            _subscriptions.OnConnectionClosed(scriptRpcContext.Connection);
        }
    }

    public async Task<SubscriptionId> Subscribe(RpcContext context, ChatMessageFilter filter)
    {
        var scriptRpcContext = context.Require<ScriptRpcContext>();
        return await _subscriptions.SubscribeAsync(scriptRpcContext.Connection, id => actor.Ask<IActorRef>(new DenoScriptActor.CreateMessagesSubscription(scriptRpcContext.Connection, filter, id)));
    }

    public void Unsubscribe(RpcContext context, SubscriptionId subscriptionId)
    {
        var scriptRpcContext = context.Require<ScriptRpcContext>();
        _subscriptions.Unsubscribe(scriptRpcContext.Connection, subscriptionId);
    }
}
