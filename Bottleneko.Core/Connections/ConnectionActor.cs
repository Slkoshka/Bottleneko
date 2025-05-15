using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Protocols;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Protocols;
using Bottleneko.Services;
using Bottleneko.Utils;

namespace Bottleneko.Connections;

record ConnectionCreationData<T>(IActorRef Owner, long ConnectionId, T Configuration);

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
            var dataType = typeof(ConnectionCreationData<>).MakeGenericType(protocol.ConfigType);
            var data = dataType.GetConstructor([typeof(IActorRef), typeof(long), protocol.ConfigType])!.Invoke([self, id, configuration]);

            Type[] contructorArgs = [typeof(IServiceProvider), typeof(INekoLogger), dataType];
            var constructor = protocol.ConnectionType.GetConstructor(contructorArgs) ?? throw new NotSupportedException($"Type '{protocol.ConnectionType.FullName}' must have a constructor with parameters ({string.Join(", ", contructorArgs.Select(arg => arg.FullName))})");
            _connection = (ConnectionBase)constructor.Invoke([Services, logger, data]);

            try
            {
                _connection.OnConnected += (_, _) => owner.Tell(Connected.Instance);
                _connection.OnRestartRequested += (_, _) => owner.Tell(new IContainerMessage.Restart(id));
                _connection.OnMessageReceived += (_, msg) =>
                {
                    akka.Tell(new IEventBusMessage.Publish("internal/connection/message_received", msg.Entity));
                    akka.Tell(new IEventBusMessage.Publish("connection/message_received", msg.Binding));
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
            Context.Stop(Self);
            return;
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
            case IControlMessage.Shutdown:
                StopConnection();
                break;

            case ConnectionDied connectionDied:
                logger.LogError("Bottleneko.Connections", "Connection died", connectionDied.Exception);
                owner.Tell(new ConnectionError(connectionDied.Exception));
                StopConnection();
                break;

            case IConnectionsMessage msg:
                _ = _connection.HandleMessageAsync(Sender, msg).PipeTo(msg is IHasReply ? Sender : Self);
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
            case IControlMessage.Shutdown:
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
            _ = _connection.DisposeAsync().AsTask();
        }
    }
}
