using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Database.Schema;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Protocols;
using Bottleneko.Scripting.Bindings;

namespace Bottleneko.Connections;

class ConnectionInstance(IServiceProvider services, INekoLogger logger, ProtocolRegistry registry, ConnectionEntity connection) : ContainerItem<ConnectionEntity, IConnectionsMessage.Update>(services, connection, connection.AutoStart)
{
    public LogRouter LocalLog { get; } = new LogRouter(LogSourceType.Connection, connection.Id.ToString());
    
    private readonly long _id = connection.Id;
    private string _name = connection.Name;
    private readonly Protocol _protocol = connection.Protocol;
    private bool _autoStart = connection.AutoStart;
    private ProtocolConfiguration _configuration = connection.Configuration;
    private ConnectionStatus _status = ConnectionStatus.NotConnected;

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

    protected override bool ApplyUpdate(IConnectionsMessage.Update update)
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

    protected override void OnStatusChange(ItemStatus status)
    {
        var oldStatus = _status;
        _status = status switch
        {
            ItemStatus.Waiting when _status != ConnectionStatus.Error => ConnectionStatus.NotConnected,
            ItemStatus.Starting => _status == ConnectionStatus.Reconnecting ? ConnectionStatus.Reconnecting : ConnectionStatus.Connecting,
            ItemStatus.Running => _status == ConnectionStatus.Reconnecting ? ConnectionStatus.Reconnecting : _status == ConnectionStatus.Connected ? ConnectionStatus.Connected : ConnectionStatus.Connecting,
            ItemStatus.Restarting => ConnectionStatus.Reconnecting,
            ItemStatus.Stopping when _status != ConnectionStatus.Error => ConnectionStatus.Stopping,
            ItemStatus.ShuttingDown when _status != ConnectionStatus.Error => ConnectionStatus.Stopping,
            _ => _status,
        };
        if (_status != oldStatus)
        {
            LocalLog.LogInfo("Bottleneko.Connection", $"Connection status changed: {oldStatus} -> {_status}");
        }
    }

    protected override bool CustomMessageHandler(object message)
    {
        switch(message)
        {
            case IConnectionsMessage.GetStatus:
                Sender.Tell(_status);
                return true;

            case IConnectionsMessage.Get:
                Sender.Tell(new ConnectionBinding()
                {
                    id = _id,
                    name = _name,
                    status = _status,
                    protocol = _protocol,
                    raw = (RawConnectionBinding)registry.GetProtocol(_protocol).BindingType.GetConstructor([typeof(long), typeof(IActorRef)])!.Invoke([_id, Self]),
                });
                return true;

            case ILoggingMessage.GetLogger:
                Sender.Tell(LocalLog);
                return true;

            case ConnectionActor.Connected:
                if (_status == ConnectionStatus.Connecting || _status == ConnectionStatus.Reconnecting)
                {
                    LocalLog.LogInfo("Bottleneko.Connection", $"Connection status changed: {_status} -> {ConnectionStatus.Connected}");
                    _status = ConnectionStatus.Connected;
                }
                return true;

            case ConnectionActor.ConnectionError:
                LocalLog.LogError("Bottleneko.Connection", $"Connection status changed: {_status} -> {ConnectionStatus.Error}");
                _status = ConnectionStatus.Error;
                return true;

            default:
                return false;
        }
    }
}
