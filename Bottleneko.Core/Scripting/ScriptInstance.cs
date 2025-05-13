using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Dtos;
using Bottleneko.Database.Schema;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Scripting.Js;

namespace Bottleneko.Scripting;

class ScriptInstance(IServiceProvider services, INekoLogger logger, ScriptEntity script) : ContainerItem<ScriptEntity, IScriptingMessage.Update>(services, script, script.AutoStart)
{
    public record FatalScriptError(Exception Exception);

    public LogRouter LocalLog { get; } = new LogRouter(LogSourceType.Script, script.Id.ToString());

    private readonly long _id = script.Id;
    private string _name = script.Name;
    private bool _autoStart = script.AutoStart;
    private ScriptCode _code = script.Code;
    private ScriptStatus _status = ScriptStatus.Stopped;

    public override async Task InitAsync(IActorRef self)
    {
        // Forward log messages to the global logger as well
        LocalLog.OnMessage += (_, msg) => logger.Log(msg.SourceType, msg.SourceId, msg.Severity, msg.Category, msg.Message, msg.Exception);
        await base.InitAsync(self);
    }

    protected override IActorRef CreateActor()
    {
        return _code switch
        {
            JsScriptCode js => CreateChild<JsScriptActor>([LocalLog , Self, _id, _name, js.Source], $"script-instance"),
            _ => throw new Exception($"Unsupported script engine: {_code}"),
        };
    }

    protected override bool ApplyUpdate(IScriptingMessage.Update update)
    {
        var needRestart = false;

        if (update.Name is not null && _name != update.Name)
        {
            _name = update.Name ?? _name;
            needRestart = true;
        }

        if (update.Code is not null && _code != update.Code)
        {
            _code = update.Code ?? _code;
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
            ItemStatus.Waiting when _status != ScriptStatus.Error => ScriptStatus.Stopped,
            ItemStatus.Starting => _status == ScriptStatus.Restarting ? ScriptStatus.Restarting : ScriptStatus.Starting,
            ItemStatus.Running => ScriptStatus.Running,
            ItemStatus.Restarting => ScriptStatus.Restarting,
            ItemStatus.Stopping when _status != ScriptStatus.Error => ScriptStatus.Stopping,
            ItemStatus.ShuttingDown when _status != ScriptStatus.Error => ScriptStatus.Stopping,
            _ => _status,
        };
        if (_status != oldStatus)
        {
            LocalLog.LogInfo("Bottleneko.Scripting", $"Script status changed: {oldStatus} -> {_status}");
        }
    }

    protected override bool CustomMessageHandler(object message)
    {
        switch (message)
        {
            case IScriptingMessage.GetStatus:
                Sender.Tell(_status);
                return true;

            case ILoggingMessage.GetLogger:
                Sender.Tell(LocalLog);
                return true;

            case FatalScriptError:
                LocalLog.LogError("Bottleneko.Scripting", $"Script status changed: {_status} -> {ConnectionStatus.Error}");
                _status = ScriptStatus.Error;
                return true;

            default:
                return false;
        }
    }
}
