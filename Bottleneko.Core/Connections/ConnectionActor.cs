using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Protocols;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Protocols;
using Bottleneko.Services;
using Bottleneko.Utils;

namespace Bottleneko.Connections;

public record ConnectionCreationData(IActorRef Owner, long ConnectionId)
{
    public StaticConnectionCreationData<T> Configure<T>(ProtocolContext context, ProtocolConfiguration configuration) where T : ProtocolConfiguration
    {
        return new(Owner, ConnectionId, context.Configure<T>(configuration));
    }
}

public record StaticConnectionCreationData<TConfig>(IActorRef Owner, long ConnectionId, StaticProtocolContext<TConfig> Context) : ConnectionCreationData(Owner, ConnectionId) where TConfig : ProtocolConfiguration;

class ConnectionActor(IServiceProvider services, AkkaService akka, INekoLogger logger, IActorRef owner, long id, ProtocolDescription protocol, ProtocolConfiguration configuration) : NekoActor(services)
{
    public record Connected : SingletonMessage<Connected>;
    public record ConnectionError(Exception Exception);
    record ConnectionStopped : SingletonMessage<ConnectionStopped>;
    record ConnectionDied(Exception Exception);
    record ConnectionDiedWhileStopping(Exception Exception);

    private ConnectionBase _connection = null!;
    private bool _connectionDisposed = false;

    public override async Task InitAsync(IActorRef self)
    {
        try
        {
            _connection = protocol.Factory(new ConnectionCreationData(self, id), new ProtocolContext(Services, logger), configuration);

            try
            {
                _connection.OnConnected += (_, _) => owner.Tell(Connected.Instance);
                _connection.OnRestartRequested += (_, isImmediate) => owner.Tell(isImmediate ? ContainerMessages.Restart.Instance : ConnectionInstance.DelayedRestart.Instance);
                _connection.OnMessageReceived += (_, msg) =>
                {
                    akka.Tell(new EventBusMessages.Publish("internal/connection/message_received", msg.Entity).ToEventBus());
                    akka.Tell(new EventBusMessages.Publish("connection/message_received", msg.Binding).ToEventBus());
                };
                _connection.OnDied += (_, ex) => self.Tell(new ConnectionDied(ex));

                await _connection.StartAsync();
            }
            catch
            {
                await _connection.DisposeAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            logger.LogError("Bottleneko.Connections", "An error has occured while starting the connection", ex);
            owner.Tell(new ConnectionError(ex));
            throw;
        }
    }

    private void StopConnection()
    {
        if (!_connectionDisposed)
        {
            _ = _connection.DisposeAsync().PipeTo(Self, Self, () => ConnectionStopped.Instance, ex => new ConnectionDiedWhileStopping(ex));
            _connectionDisposed = true;
        }
        Become(Stopping);
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case ControlMessages.Shutdown:
                StopConnection();
                break;

            case ConnectionDied connectionDied:
                logger.LogError("Bottleneko.Connections", "Connection died", connectionDied.Exception);
                owner.Tell(new ConnectionError(connectionDied.Exception));
                StopConnection();
                break;

            case IHandledByConnection msg:
                _ = _connection.HandleMessageAsync(Sender, msg).PipeTo(Sender);
                break;

            case Status.Failure failure:
                logger.LogError("Bottleneko.Connections", "An error has occured", failure.Cause);
                break;

            default:
                Unhandled(message);
                break;
        }
    }

    private void Stopping(object message)
    {
        switch (message)
        {
            case ControlMessages.Shutdown:
                break;

            case ConnectionStopped:
                Context.Stop(Self);
                break;

            case ConnectionDiedWhileStopping connectionDiedWhileStopping:
                logger.LogError("Bottleneko.Connections", "An error has occured while disconnecting", connectionDiedWhileStopping.Exception);
                owner.Tell(new ConnectionError(connectionDiedWhileStopping.Exception));
                Context.Stop(Self);
                break;

            default:
                Unhandled(message);
                break;
        }
    }

    protected override void PostStop()
    {
        if (!_connectionDisposed)
        {
            _ = _connection?.DisposeAsync().AsTask();
        }
    }
}
