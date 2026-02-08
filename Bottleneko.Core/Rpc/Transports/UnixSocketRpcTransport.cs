using System.Net.Sockets;
using Akka.Actor;
using Bottleneko.Messages;
using Bottleneko.Utils;

namespace Bottleneko.Rpc.Transports;

class UnixSocketRpcTransport(IServiceProvider services, NekoEnvironment environment, string name, bool abstractSocket) : RpcTransportBase(services)
{
    record ClientConnected(Socket Socket);
    record Error(Exception Exception);
    record CleanupFinished : SingletonMessage<CleanupFinished>;

    private readonly Socket _socket = new(AddressFamily.Unix, SocketType.Stream, ProtocolType.IP);
    private readonly CancellationTokenSource _cts = new();
    private readonly List<IActorRef> _children = [];
    private bool _isShuttingDown = false;
    private bool _cleanupFinished = false;

    public override Task InitAsync(IActorRef self)
    {
        _socket.Bind(new UnixDomainSocketEndPoint(abstractSocket ? $"\0{name}" : Path.Combine(environment.DataPath, $"{name}.socket")));
        _socket.Listen();
        _ = _socket.AcceptAsync().PipeTo(self, self, socket => new ClientConnected(socket), ex => ex is OperationCanceledException ? null : new Error(ex));

        return Task.CompletedTask;
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case ClientConnected clientConnected:
                if (_isShuttingDown)
                {
                    clientConnected.Socket.Close();
                    clientConnected.Socket.Dispose();
                }
                else
                {
                    _children.Add(CreateChild<SocketRpcClient>([clientConnected.Socket]));
                    Context.Watch(_children[^1]);
                    _ = _socket.AcceptAsync().PipeTo(Self, Self, socket => new ClientConnected(socket), ex => ex is OperationCanceledException ? null : new Error(ex));
                }
                break;

            case CleanupFinished:
                _cleanupFinished = true;
                if (_children.Count == 0)
                {
                    Context.Stop(Self);
                }
                break;

            case RpcMessages.GetEndPoint getEndPoint:
                Sender.Tell(new RpcEndPoint(abstractSocket ? "unixabstract" : "unix", name));
                break;

            case Terminated t:
                _children.Remove(t.ActorRef);
                if (_children.Count == 0 && _cleanupFinished)
                {
                    Context.Stop(Self);
                }
                break;

            default:
                base.OnMessage(message);
                break;
        }
    }

    protected override void Shutdown()
    {
        async Task CleanupAsync(IActorRef self)
        {
            _isShuttingDown = true;
            await _cts.CancelAsync();
            _cts.Dispose();
            _socket.Dispose();
            foreach (var child in _children)
            {
                child.Tell(ControlMessages.Shutdown.Instance);
            }
        }

        _ = CleanupAsync(Self).PipeTo(Self, Self, () => CleanupFinished.Instance, ex => new Error(ex));
    }
}
