using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Database.Schema;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Protocols;
using Bottleneko.Scripting.Bindings;
using Bottleneko.Utils;

namespace Bottleneko.Connections;

class ConnectionInstance(IServiceProvider services, INekoLogger logger, ProtocolRegistry registry, ConnectionEntity connection) : ContainerItem<ConnectionMessages.Update>(services, connection.AutoStart)
{
    public record DelayedRestart : SingletonMessage<DelayedRestart>;

    public LogRouter LocalLog { get; } = new LogRouter(LogSourceType.Connection, connection.Id.ToString());

    private static readonly TimeSpan _defaultReconnectDelay = TimeSpan.FromSeconds(3.0);
    private static readonly TimeSpan _maxReconnectDelay = TimeSpan.FromHours(1.0);

    private readonly long _id = connection.Id;
    private string _name = connection.Name;
    private readonly Protocol _protocol = connection.Protocol;
    private bool _autoStart = connection.AutoStart;
    private ProtocolConfiguration _configuration = connection.Configuration;
    private ConnectionStatus _status = ConnectionStatus.NotConnected;
    private DateTime _statusChangeTime;

    private TimeSpan _reconnectDelay = _defaultReconnectDelay;

    public override async Task InitAsync(IActorRef self)
    {
        // Forward log messages to the global logger as well
        LocalLog.OnMessage += (_, msg) => logger.Log(msg.SourceType, msg.SourceId, msg.Severity, msg.Category, msg.Message, msg.Exception);
        await base.InitAsync(self);
    }

    protected override IActorRef CreateActor()
    {
        return CreateChild<ConnectionActor>([Services, LocalLog, Self, _id, registry.GetProtocol(_protocol), _configuration], _protocol.ToString());
    }

    protected override bool ApplyUpdate(ConnectionMessages.Update update)
    {
        var needRestart = false;

        _name = update.Name ?? _name;

        if (update.Configuration is not null && _configuration != update.Configuration)
        {
            _configuration = update.Configuration ?? _configuration;
            needRestart = true;
        }

        _autoStart = update.AutoStart ?? _autoStart;

        return needRestart;
    }

    protected override void OnStatusChange(ItemStatus status, TimeSpan delay)
    {
        var oldStatus = _status;
        _status = status switch
        {
            ItemStatus.Waiting when _status != ConnectionStatus.Error => ConnectionStatus.NotConnected,
            ItemStatus.Starting => _status is ConnectionStatus.Reconnecting or ConnectionStatus.DelayedReconnect ? ConnectionStatus.Reconnecting : ConnectionStatus.Connecting,
            ItemStatus.Running => _status is ConnectionStatus.Reconnecting or ConnectionStatus.DelayedReconnect ? ConnectionStatus.Reconnecting : _status == ConnectionStatus.Connected ? ConnectionStatus.Connected : ConnectionStatus.Connecting,
            ItemStatus.Restarting => ConnectionStatus.Reconnecting,
            ItemStatus.DelayedRestart => ConnectionStatus.DelayedReconnect,
            ItemStatus.Stopping when _status != ConnectionStatus.Error => ConnectionStatus.Stopping,
            ItemStatus.ShuttingDown when _status != ConnectionStatus.Error => ConnectionStatus.Stopping,
            _ => _status,
        };
        _statusChangeTime = DateTime.UtcNow + delay;
        if (_status != oldStatus)
        {
            LocalLog.LogInfo("Bottleneko.Connection", $"Connection status changed: [{oldStatus}] -> [{_status}]");
        }
    }

    protected override bool CustomMessageHandler(object message)
    {
        switch (message)
        {
            case ConnectionMessages.GetStatus:
                Sender.Tell(new ExtendedConnectionStatus(_status, _status == ConnectionStatus.DelayedReconnect ? Math.Max(0, (float)(_statusChangeTime - DateTime.UtcNow).TotalSeconds) : 0.0f));
                return true;

            case ConnectionMessages.GetBinding:
                Sender.Tell(new ConnectionBinding(registry.GetProtocol(_protocol).BindingFactory(_id, Self))
                {
                    id = _id,
                    name = _name,
                    status = _status,
                    protocol = _protocol,
                });
                return true;

            case LoggingMessages.GetLogger:
                Sender.Tell(LocalLog);
                return true;

            case DelayedRestart:
                LocalLog.LogInfo("Bottleneko.Connection", $"Delaying reconnect by {_reconnectDelay.TotalSeconds:N0} seconds");
                Self.Tell(new ContainerMessages.DelayedRestart(_reconnectDelay));
                _reconnectDelay = TimeSpan.FromSeconds(Math.Min(_reconnectDelay.TotalSeconds * 2, _maxReconnectDelay.TotalSeconds));
                return true;

            case ConnectionActor.Connected:
                _reconnectDelay = _defaultReconnectDelay;
                if (_status is ConnectionStatus.Connecting or ConnectionStatus.Reconnecting or ConnectionStatus.DelayedReconnect)
                {
                    LocalLog.LogInfo("Bottleneko.Connection", $"Connection status changed: [{_status}] -> [{ConnectionStatus.Connected}]");
                    _status = ConnectionStatus.Connected;
                }
                return true;

            case ConnectionActor.ConnectionError:
                LocalLog.LogError("Bottleneko.Connection", $"Connection status changed: [{_status}] -> [{ConnectionStatus.Error}]");
                _status = ConnectionStatus.Error;
                return true;

            default:
                return false;
        }
    }
}
