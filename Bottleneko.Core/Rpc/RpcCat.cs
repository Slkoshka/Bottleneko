using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Packets;
using Bottleneko.Messages;
using Bottleneko.Utils;

namespace Bottleneko.Rpc;

record RpcEndPoint(string Transport, string Name);

class RpcCat(IServiceProvider services, NekoEnvironment environment) : NekoActor(services)
{
    record Start() : SingletonMessage<Start>;
    public record PacketReceived(Packet Packet);

    private IActorRef _transport = null!;

    private IActorRef CreateTransport()
    {
        if (OperatingSystem.IsWindows())
        {
            throw new PlatformNotSupportedException();
        }
        else if (OperatingSystem.IsLinux())
        {
            return CreateChild<UnixSocketRpcActor>(["bottleneko-rpc", true], "transport");
        }
        else if (OperatingSystem.IsMacOS())
        {
            return CreateChild<UnixSocketRpcActor>([Path.Combine(environment.DataPath, "rpc.socket"), false], "transport");
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

            case Terminated t:
                if (t.ActorRef == _transport)
                {
                    Context.Stop(Self);
                }
                break;

            case ControlMessages.Shutdown:
                _transport.Tell(ControlMessages.Shutdown.Instance);
                break;

            default:
                Unhandled(message);
                break;
        }
    }
}
