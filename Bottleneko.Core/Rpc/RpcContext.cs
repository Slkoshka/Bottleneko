using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Database.Schema;

namespace Bottleneko.Rpc;

public abstract record RpcContext(IActorRef RpcConnection, RpcCallerRole CallerRole) : IRpcContext
{
    public void RequireRole(params Span<RpcCallerRole> roles)
    {
        if (!roles.Contains(CallerRole))
        {
            throw new Exception("Unauthorized");
        }
    }
}

public record ApiRpcContext(IActorRef RpcConnection, UserEntity? User) : RpcContext(RpcConnection, User is null ? RpcCallerRole.Anonymous : RpcCallerRole.User);

public record ScriptRpcContext(IActorRef RpcConnection, IActorRef Script) : RpcContext(RpcConnection, RpcCallerRole.Script);
