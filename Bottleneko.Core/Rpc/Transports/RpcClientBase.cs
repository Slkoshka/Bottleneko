using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Rpc;
using Bottleneko.Database.Schema;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Services;
using Bottleneko.Utils;

namespace Bottleneko.Rpc.Transports;

abstract class RpcClientBase(IServiceProvider services, AkkaService akka, INekoLogger logger) : NekoActor(services)
{
    abstract record State
    {
        public record WaitingForAuthentication : State;

        public record Authenticating : State;

        public record Running : State;
        public record RunningScript(IActorRef Actor, long Id) : Running;
        public record RunningApi(UserEntity? User) : Running;

        public record Dead : State;
    }

    record AuthenticateAsScript(IActorRef Actor, long Id);
    record AuthenticateAsApi(UserEntity? User);
    record AuthenticationFailure(string Message);

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

        switch (_state)
        {
            case State.RunningScript runningScript:
                runningScript.Actor.Tell(new RpcMessages.ConnectionClosed(new ScriptRpcContext(Self, runningScript.Actor)));
                break;

            case State.RunningApi runningApi:
                akka.Tell(new RpcMessages.ConnectionClosed(new ApiRpcContext(Self, runningApi.User)).ToApi());
                break;
        }

        _state = new State.Dead();
    }

    protected bool CustomMessageHandler(object message)
    {
        switch (message)
        {
            case AuthenticateAsScript authenticateAsScript:
                Logger.LogVerbose("Bottleneko.Rpc", $"[{_connectionId}] Authenticated as script #{authenticateAsScript.Id}");
                Context.Watch(authenticateAsScript.Actor);
                _state = new State.RunningScript(authenticateAsScript.Actor, authenticateAsScript.Id);
                while (_packetStash.TryDequeue(out var packet))
                {
                    OnPacketReceived(packet);
                }
                return true;

            case AuthenticateAsApi authenticateAsApi:
                Logger.LogVerbose("Bottleneko.Rpc", $"[{_connectionId}] Authenticated as user '{authenticateAsApi.User?.Login ?? "Anonymous"}'");
                _state = new State.RunningApi(authenticateAsApi.User);
                while (_packetStash.TryDequeue(out var packet))
                {
                    OnPacketReceived(packet);
                }
                return true;
            
            case Terminated t:
                if (_state is State.RunningScript runningScript && runningScript.Actor == t.ActorRef)
                {
                    Self.Tell(ControlMessages.Shutdown.Instance);
                    return true;
                }
                return false;

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
                                _state = new State.Authenticating();
                                _ = akka.AskAsync(new ApiMessages.Authenticate(authenticatePacket.AccessToken).ToApi().WithReply<ApiMessages.AuthenticationResult>())
                                    .PipeTo(Self, Self, result => new AuthenticateAsApi(result.User), ex => new AuthenticationFailure(ex.ToString()));
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
                    switch (_state)
                    {
                        case State.RunningScript runningScript:
                        {
                            var context = new ScriptRpcContext(Self, runningScript.Actor);
                            _ = runningScript.Actor.Ask<ResponsePacket>(new RpcMessages.HandleRequest(context, request)).PipeTo(Self, runningScript.Actor,
                                result => new RpcMessages.SendPacket(result),
                                ex => new RpcMessages.SendPacket(new ResponsePacket(request.RequestId, ex.ToRpcError()))
                            );
                            break;
                        }

                        case State.RunningApi runningApi:
                        {
                            var context = new ApiRpcContext(Self, runningApi.User);
                            _ = akka.AskAsync(new RpcMessages.HandleRequest(context, request).ToApi().WithReply<ResponsePacket>()).PipeTo(Self, Self,
                                result => new RpcMessages.SendPacket(result),
                                ex => new RpcMessages.SendPacket(new ResponsePacket(request.RequestId, ex.ToRpcError()))
                            );
                            break;
                        }
                    }
                }
                break;

            case State.Dead:
                break;
        }
    }
}
