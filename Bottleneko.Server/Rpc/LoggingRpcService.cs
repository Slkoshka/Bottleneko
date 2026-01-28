using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Logging;
using Bottleneko.Rpc;
using Bottleneko.Server.Actors;

namespace Bottleneko.Server.Rpc;

class LoggingRpcService(ApiCat api, IActorRef actor) : ILoggingService
{
    private readonly SubscriptionManager _subscriptions = new();

    public void Log(RpcContext context, LogSeverity severity, string message)
    {
        if (context.IsAnonymous)
        {
            return;
        }

        api.Logger.Log(severity, "Bottleneko.Api", message);
    }

    public async Task<SubscriptionId> SubscribeAsync(RpcContext context, LogFilter filter)
    {
        var apiRpcContext = context.Require<ApiRpcContext>();
        apiRpcContext.RequireAuthentication();

        return await _subscriptions.SubscribeAsync(apiRpcContext.Connection, id => actor.Ask<IActorRef>(new ApiCat.CreateLogSubscription(apiRpcContext.Connection, filter, id)));
    }

    public void Unsubscribe(RpcContext context, SubscriptionId subscriptionId)
    {
        var scriptRpcContext = context.Require<ApiRpcContext>();
        _subscriptions.Unsubscribe(scriptRpcContext.Connection, subscriptionId);
    }
}
