using Akka.Actor;
using Bottleneko.Messages;
using Bottleneko.Connections;
using Bottleneko.Scripting;
using Bottleneko.Events;
using Bottleneko.Logging;

namespace Bottleneko.Actors;

public class NekoWorld(IServiceProvider services, INekoLogger logger) : NekoActor(services)
{
    private IActorRef? _connections = null;
    private IActorRef? _scripting = null;
    private IActorRef? _eventBus = null;

    public override Task InitAsync(IActorRef self)
    {
        (logger as LogRouter)!.OnMessage += (_, msg) => _eventBus?.Tell(new IEventBusMessage.Publish("internal/log/message", msg));

        IActorRef[] cats = [
            _connections = CreateChild<ConnectionsCat>([], "connections"),
            _scripting = CreateChild<ScriptingCat>([], "scripting"),
            _eventBus = CreateChild<EventBusCat>([], "event-bus"),
        ];
        
        foreach (var cat in cats)
        {
            Context.Watch(cat);
        }

        return Task.WhenAll(cats.Select(cat => cat.Ask(IControlMessage.Ready.Instance)));
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case IConnectionsMessage when _connections is not null:
                _connections.Forward(message);
                break;

            case IScriptingMessage when _scripting is not null:
                _scripting.Forward(message);
                break;

            case IEventBusMessage when _eventBus is not null:
                _eventBus.Forward(message);
                break;

            case ILoggingMessage.GetLogger getLogger:
                switch (getLogger)
                {
                    case { Filter.SourceType: LogSourceType.Connection, Filter.SourceId: not null }:
                        _connections?.Forward(message);
                        break;

                    case { Filter.SourceType: LogSourceType.Script, Filter.SourceId: not null }:
                        _scripting?.Forward(message);
                        break;

                    default:
                        Sender.Tell(logger);
                        break;
                }
                break;

            case IControlMessage.Shutdown:
                logger.LogInfo("Bottleneko", "Shutting down...");
                _connections?.Tell(IControlMessage.Shutdown.Instance);
                _scripting?.Tell(IControlMessage.Shutdown.Instance);
                _eventBus?.Tell(IControlMessage.Shutdown.Instance);
                break;

            case Terminated t:
                if (t.ActorRef == _connections)
                {
                    logger.LogVerbose("Bottleneko", "Connections have shut down");
                    _connections = null;
                }
                if (t.ActorRef == _scripting)
                {
                    logger.LogVerbose("Bottleneko", "Scripts have shut down");
                    _scripting = null;
                }
                if (t.ActorRef == _eventBus)
                {
                    logger.LogVerbose("Bottleneko", "EventBus has shut down");
                    _eventBus = null;
                }
                if (_connections is null && _scripting is null && _eventBus is null)
                {
                    logger.LogVerbose("Bottleneko", "Bye!");
                    Context.Stop(Self);
                }
                break;

            default:
                Unhandled(message);
                break;
        }
    }
}
