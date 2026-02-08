using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Api.Rpc.Services;
using Bottleneko.Logging;
using Bottleneko.Messages;

namespace Bottleneko.Rpc.Services;

public class LoggingRpcService(IActorRef actor, INekoLogger logger) : ILoggingService
{
    private readonly SubscriptionManager _subscriptions = new();

    public void Log(IRpcContext context, LogSeverity severity, string message)
    {
        switch (context)
        {
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case ApiRpcContext:
                logger.Log(severity, "Bottleneko.Api", message);
                break;

            case ScriptRpcContext:
                logger.Log(severity, "Bottleneko.Script", message);
                break;

            default:
                throw new RpcUnsupportedException();
        }
    }

    public async Task<SubscriptionId> SubscribeAsync(IRpcContext context, LogFilter filter)
    {
        switch (context)
        {
            case not ApiRpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case ApiRpcContext ctx:
                return await _subscriptions.SubscribeAsync(ctx.Connection, id => actor.Ask<IActorRef>(new RpcMessages.CreateLogSubscription(ctx.Connection, filter, id)));
        }
    }

    public void Unsubscribe(IRpcContext context, SubscriptionId subscriptionId)
    {
        switch (context)
        {
            case not ApiRpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case ApiRpcContext ctx:
                _subscriptions.Unsubscribe(ctx.Connection, subscriptionId);
                break;
        }
    }
}
