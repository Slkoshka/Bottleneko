using Akka.Actor;
using Bottleneko.Messages;
using Bottleneko.Connections;
using Bottleneko.Scripting;
using Bottleneko.Events;
using Bottleneko.Logging;

namespace Bottleneko.Actors;

public class NekoWorld(IServiceProvider services, INekoLogger logger) : NekoActor(services)
{
    record CatReady(IActorRef Cat);
    record CatDied(IActorRef Cat, Exception Exception);

    record CatStartup(Func<NekoWorld, IActorRef> Handler);

    private static readonly CatStartup[] _startupSequence =
    [
        new(world => world._eventBus = CreateChild<EventBusCat>([], "event-bus")),
        new(world => world._scripting = CreateChild<ScriptingCat>([], "scripting")),
        new(world => world._connections = CreateChild<ConnectionsCat>([], "connections")),
    ];
    private int _startupSequenceIndex = -1;
    private bool _isShuttingDown = false;

    private IActorRef? _eventBus = null;
    private IActorRef? _connections = null;
    private IActorRef? _scripting = null;

    public override Task InitAsync(IActorRef self)
    {
        (logger as LogRouter)!.OnMessage += (_, msg) => _eventBus?.Tell(new IEventBusMessage.Publish("internal/log/message", msg));

        logger.LogDebug("Bottleneko.NekoWorld", "Creating Neko World...");

        StartNextCat();

        return Task.CompletedTask;
    }

    private void StartNextCat()
    {
        if (_startupSequenceIndex >= _startupSequence.Length - 1)
        {
            logger.LogDebug("Bottleneko.NekoWorld", $"Neko World is ready");

            Become(OnRunning);
            return;
        }

        logger.LogDebug("Bottleneko.NekoWorld", $"Spawning cat {_startupSequenceIndex + 2}/{_startupSequence.Length}...");

        var step = _startupSequence[++_startupSequenceIndex];
        var cat = step.Handler(this);
        Context.Watch(cat);
        _ = cat.Ask(IControlMessage.Ready.Instance).PipeTo(Self, cat, () => new CatReady(cat), ex => new CatDied(cat, ex));
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case CatReady:
                Stash.UnstashAll();
                StartNextCat();
                break;

            case CatDied died:
                logger.LogError("Bottleneko", $"Cat {died.Cat.Path} has failed to start: {died.Exception}");
                Self.Tell(IControlMessage.Shutdown.Instance);
                break;

            case IEventBusMessage:
                if (_eventBus is not null)
                {
                    _eventBus.Forward(message);
                }
                else
                {
                    Stash.Stash();
                }
                break;

            case IScriptingMessage:
                if (_scripting is not null)
                {
                    _scripting.Forward(message);
                }
                else
                {
                    Stash.Stash();
                }
                break;

            case IConnectionsMessage:
                if (_connections is not null)
                {
                    _connections.Forward(message);
                }
                else
                {
                    Stash.Stash();
                }
                break;

            case ILoggingMessage.GetLogger:
                Stash.Stash();
                break;

            case IControlMessage.Shutdown:
                logger.LogInfo("Bottleneko", "Shutting down...");
                _isShuttingDown = true;
                _connections?.Tell(IControlMessage.Shutdown.Instance);
                _scripting?.Tell(IControlMessage.Shutdown.Instance);
                _eventBus?.Tell(IControlMessage.Shutdown.Instance);
                break;

            case Terminated t:
                if (t.ActorRef == _connections)
                {
                    _connections = null;
                    if (!_isShuttingDown)
                    {
                        Self.Tell(IControlMessage.Shutdown.Instance);
                    }
                }
                if (t.ActorRef == _scripting)
                {
                    _scripting = null;
                    if (!_isShuttingDown)
                    {
                        Self.Tell(IControlMessage.Shutdown.Instance);
                    }
                }
                if (t.ActorRef == _eventBus)
                {
                    _eventBus = null;
                    if (!_isShuttingDown)
                    {
                        Self.Tell(IControlMessage.Shutdown.Instance);
                    }
                }

                if (_connections is null && _scripting is null && _eventBus is null)
                {
                    if (_isShuttingDown)
                    {
                        logger.LogVerbose("Bottleneko", "Bye!");
                    }
                    Context.Stop(Self);
                }
                break;

            default:
                Unhandled(message);
                break;
        }
    }

    private void OnRunning(object message)
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
