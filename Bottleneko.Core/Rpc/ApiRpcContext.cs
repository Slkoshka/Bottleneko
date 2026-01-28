using Akka.Actor;
using Bottleneko.Api.Rpc;

namespace Bottleneko.Rpc;

public record ApiRpcContext(IActorRef Connection, object UserData) : RpcContext;
