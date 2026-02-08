using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Database.Schema;

namespace Bottleneko.Rpc;

public abstract record RpcContext(IActorRef Connection, RpcCallerRole CallerRole) : IRpcContext
{
    public void RequireRole(params Span<RpcCallerRole> roles)
    {
        if (!roles.Contains(CallerRole))
        {
            throw new Exception("Unauthorized");
        }
    }
}

public record ApiRpcContext(IActorRef Connection, UserEntity? User) : RpcContext(Connection, User is null ? RpcCallerRole.Anonymous : RpcCallerRole.User);

public record ScriptRpcContext(IActorRef Connection, IActorRef Script) : RpcContext(Connection, RpcCallerRole.Script);
