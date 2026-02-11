using System.IO.Pipes;
using Akka.Actor;
using Bottleneko.Messages;
using Bottleneko.Utils;

namespace Bottleneko.Rpc.Transports;

class NamedPipeRpcTransport(IServiceProvider services, string name) : RpcTransportBase(services)
{
    record ClientConnected(NamedPipeServerStream Stream);
    record Error(Exception Exception);
    record CleanupFinished : SingletonMessage<CleanupFinished>;

    private NamedPipeServerStream _server = null!;
    private readonly CancellationTokenSource _cts = new();
    private readonly List<IActorRef> _children = [];
    private bool _isShuttingDown = false;
    private bool _cleanupFinished = false;

    private static NamedPipeServerStream CreateServer(string name)
    {
        return new(name, PipeDirection.InOut, NamedPipeServerStream.MaxAllowedServerInstances, PipeTransmissionMode.Byte, PipeOptions.Asynchronous | PipeOptions.CurrentUserOnly);
    }

    public override Task InitAsync(IActorRef self)
    {
        var server = _server = CreateServer(name);
        _ = server.WaitForConnectionAsync(_cts.Token).PipeTo(self, self, () => new ClientConnected(server), ex => ex is OperationCanceledException ? null : new Error(ex));

        return Task.CompletedTask;
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case ClientConnected clientConnected:
                if (_isShuttingDown)
                {
                    clientConnected.Stream.Dispose();
                }
                else
                {
                    _children.Add(CreateChild<NamedPipeRpcClient>([clientConnected.Stream]));
                    Context.Watch(_children[^1]);

                    var server = _server = CreateServer(name);
                    _ = server.WaitForConnectionAsync(_cts.Token).PipeTo(Self, Self, () => new ClientConnected(server), ex => ex is OperationCanceledException ? null : new Error(ex));
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
                Sender.Tell(new RpcEndPoint("namedpipes", name));
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
            await _server.DisposeAsync();
            foreach (var child in _children)
            {
                child.Tell(ControlMessages.Shutdown.Instance);
            }
        }

        _ = CleanupAsync(Self).PipeTo(Self, Self, () => CleanupFinished.Instance, ex => new Error(ex));
    }
}
