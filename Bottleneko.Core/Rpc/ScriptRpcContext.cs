using Akka.Actor;
using Bottleneko.Api.Rpc;

namespace Bottleneko.Rpc;

public record ScriptRpcContext(IActorRef Connection, IActorRef Script) : RpcContext;
