using Bottleneko.Api.Rpc;
using Bottleneko.Logging;
using Bottleneko.Scripting.Deno;

namespace Bottleneko.Scripting.Rpc;

class LoggingRpcService(DenoScriptActor script) : ILoggingService
{
    public void Log(RpcContext context, LogSeverity severity, string message)
    {
        script.Logger.Log(severity, "Bottleneko.Script", message);
    }

    public Task<SubscriptionId> SubscribeAsync(RpcContext context, LogFilter filter)
    {
        throw new Exception("Unsupported");
    }

    public void Unsubscribe(RpcContext context, SubscriptionId subscriptionId)
    {
        throw new Exception("Unsupported");
    }
}
