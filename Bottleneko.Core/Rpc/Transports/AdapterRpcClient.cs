using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Services;
using Bottleneko.Utils;

namespace Bottleneko.Rpc.Transports;

class AdapterRpcClient(IServiceProvider services, AkkaService akka, INekoLogger logger, Func<Packet, Task> sendCallback) : RpcClientBase(services, akka, logger)
{
    record Connected : SingletonMessage<Connected>;
    record ConnectionError(Exception Exception);
    record PacketSent : SingletonMessage<PacketSent>;

    private bool _isSending = false;

    public override Task InitAsync(IActorRef self)
    {
        self.Tell(Connected.Instance);
        return Task.CompletedTask;
    }

    protected override void Send(Packet packet)
    {
        Self.Tell(new RpcMessages.SendPacket(packet));
    }

    protected override void Error(string message)
    {
        Self.Tell(new ConnectionError(new Exception(message)));
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case Connected:
                OnConnected();
                break;

            case RpcMessages.PacketReceived packetReceived:
                OnPacketReceived(packetReceived.Packet);
                break;

            case RpcMessages.SendPacket sendPacket:
                if (_isSending)
                {
                    Stash.Stash();
                }
                else
                {
                    _isSending = true;
                    _ = sendCallback(sendPacket.Packet).PipeTo(Self, Self, () => PacketSent.Instance, ex => ex is OperationCanceledException ? null : new ConnectionError(ex));
                }
                break;

            case PacketSent:
                _isSending = false;
                Stash.Unstash();
                break;

            case ConnectionError connectionError:
                Logger.LogWarning("Bottleneko.Rpc", "Connection error", connectionError.Exception);
                Context.Stop(Self);
                break;

            case ControlMessages.Shutdown:
                Context.Stop(Self);
                break;

            default:
                if (!CustomMessageHandler(message))
                {
                    Unhandled(message);
                }
                break;
        }
    }
}
