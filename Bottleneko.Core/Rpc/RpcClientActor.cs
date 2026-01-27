using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Packets;
using Bottleneko.Api.Rpc;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Services;

namespace Bottleneko.Rpc;

abstract class RpcClientActor(IServiceProvider services, AkkaService akka, INekoLogger logger) : NekoActor(services)
{
    abstract record State
    {
        public record WaitingForAuthentication : State;

        public record Authenticating : State;

        public record Running : State;
        public record RunningScript(IActorRef Actor, long Id) : Running;

        public record Dead : State;
    }

    record AuthenticateAsScript(IActorRef Actor, long Id);

    public INekoLogger Logger { get; } = logger;
    private State _state = new State.WaitingForAuthentication();
    private readonly Queue<Packet> _packetStash = [];

    protected abstract void Send(Packet packet);
    protected abstract void Error(string message);

    private readonly string _connectionId = Guid.NewGuid().ToString("N");

    protected void OnConnected()
    {
        Logger.LogVerbose("Bottleneko.Rpc", $"[{_connectionId}] Client connected");
    }

    protected void OnDisconnected()
    {
        Logger.LogVerbose("Bottleneko.Rpc", $"[{_connectionId}] Connection closed");
    }

    protected bool CustomMessageHandler(object message)
    {
        switch (message)
        {
            case AuthenticateAsScript authenticateAsScript:
                Logger.LogVerbose("Bottleneko.Rpc", $"[{_connectionId}] Authenticated as script #{authenticateAsScript.Id}");
                _state = new State.RunningScript(authenticateAsScript.Actor, authenticateAsScript.Id);
                while (true)
                {
                    if (_packetStash.TryDequeue(out var packet))
                    {
                        OnPacketReceived(packet);
                    }
                    else
                    {
                        break;
                    }
                }
                return true;

            default:
                return false;
        }
    }

    protected void OnPacketReceived(Packet packet)
    {
        switch (_state)
        {
            case State.WaitingForAuthentication:
                switch (packet)
                {
                    case AuthenticatePacket authenticatePacket:
                        switch (authenticatePacket.ClientType)
                        {
                            case ClientType.Script:
                                _state = new State.Authenticating();
                                _ = akka.AskAsync(new ScriptingMessages.Authenticate(authenticatePacket.AccessToken).ToScripting().WithReply<(IActorRef Actor, long Id)>())
                                    .PipeTo(Self, Self, script => new AuthenticateAsScript(script.Actor, script.Id));
                                break;
                            
                            case ClientType.Api:
                                // TODO
                                Error("Unsupported");
                                break;
                        }
                        break;

                    default:
                        Error("Unexpected packet");
                        break;
                }
                break;

            case State.Authenticating:
                _packetStash.Enqueue(packet);
                break;

            case State.Running:
                if (packet is RequestPacket request)
                {
                    if (_state is State.RunningScript runningScript)
                    {
                        _ = runningScript.Actor.Ask<ResponsePacket>(request).PipeTo(Self, runningScript.Actor,
                            result => new RpcMessages.SendPacket(result),
                            ex => new RpcMessages.SendPacket(new ResponsePacket(request.RequestId, new ErrorResult(ex.ToString())))
                        );
                    }
                }
                break;

            case State.Dead:
                break;
        }
    }
}
