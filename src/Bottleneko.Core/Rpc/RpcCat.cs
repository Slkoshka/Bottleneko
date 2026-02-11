using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Messages;
using Bottleneko.Rpc.Transports;
using Bottleneko.Utils;

namespace Bottleneko.Rpc;

record RpcEndPoint(string Transport, string Name);

class RpcCat(IServiceProvider services, NekoEnvironment environment) : NekoActor(services)
{
    record Start() : SingletonMessage<Start>;

    private IActorRef _transport = null!;
    private readonly List<IActorRef> _adapters = [];

    private IActorRef CreateTransport()
    {
        if (OperatingSystem.IsWindows())
        {
            return CreateChild<NamedPipeRpcTransport>(["bottleneko-rpc"], "transport");
        }
        else if (OperatingSystem.IsLinux())
        {
            return CreateChild<UnixSocketRpcTransport>(["bottleneko-rpc", true], "transport");
        }
        else if (OperatingSystem.IsMacOS())
        {
            return CreateChild<UnixSocketRpcTransport>([Path.Combine(environment.DataPath, "rpc.socket"), false], "transport");
        }
        else
        {
            throw new PlatformNotSupportedException();
        }
    }

    public override Task InitAsync(IActorRef self)
    {
        self.Tell(Start.Instance);
        return Task.CompletedTask;
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case Start:
                _transport = CreateTransport();
                Context.Watch(_transport);
                break;

            case RpcMessages.SendPacket sendPacket:
                _transport.Forward(sendPacket);
                break;

            case RpcMessages.GetEndPoint getEndPoint:
                _transport.Forward(getEndPoint);
                break;
            
            case RpcMessages.CreateRpcAdapter createRpcAdapter:
                Sender.Tell(CreateChild<AdapterRpcClient>([createRpcAdapter.SendCallback]));
                break;

            case Terminated t:
                if (t.ActorRef == _transport)
                {
                    Context.Stop(Self);
                }
                else
                {
                    _adapters.Remove(t.ActorRef);
                }
                break;

            case ControlMessages.Shutdown:
                _transport.Tell(ControlMessages.Shutdown.Instance);
                foreach (var adapter in _adapters)
                {
                    adapter.Tell(ControlMessages.Shutdown.Instance);
                }
                break;

            default:
                Unhandled(message);
                break;
        }
    }
}
