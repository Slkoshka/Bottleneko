using Akka.Actor;
using Bottleneko.Connections;
using Bottleneko.Events;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Rpc;
using Bottleneko.Scripting;

namespace Bottleneko.Actors;

public enum CatType
{
    Connections,
    Scripting,
    Rpc,
    Api,
    EventBus,
}

public class NekoWorld(IServiceProvider services, INekoLogger logger, Type apiCatType) : NekoActor(services)
{
    record CatReady(IActorRef Cat);
    record CatDied(CatType Cat, Exception Exception);

    record CatStartup(CatType Cat, Func<IActorRef> Handler);

    private readonly CatStartup[] _startupSequence =
    [
        new(CatType.EventBus, () => CreateChild<EventBusCat>([], "event-bus")),
        new(CatType.Api, () => CreateChild(apiCatType, [], "api")),
        new(CatType.Rpc, () => CreateChild<RpcCat>([], "rpc")),
        new(CatType.Scripting, () => CreateChild<ScriptingCat>([], "scripting")),
        new(CatType.Connections, () => CreateChild<ConnectionsCat>([], "connections")),
    ];
    private int _startupSequenceIndex = -1;
    private bool _isShuttingDown = false;

    private readonly Dictionary<CatType, IActorRef> _cats = [];

    public override Task InitAsync(IActorRef self)
    {
        (logger as LogRouter)!.OnMessage += (_, msg) => _cats.GetValueOrDefault(CatType.EventBus)?.Tell(new EventBusMessages.Publish("internal/log/message", msg));

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
        IActorRef cat;

        try
        {
            cat = step.Handler();
        }
        catch (Exception ex)
        {
            Self.Tell(new CatDied(step.Cat, ex));
            return;
        }

        _cats[step.Cat] = cat;
        Context.Watch(cat);
        _ = cat.Ask(ControlMessages.Ready.Instance).PipeTo(Self, cat, () => new CatReady(cat), ex => new CatDied(step.Cat, ex));
    }

    private void TryRoute(RoutingMessages.ForwardMessage message, bool stashIfNotAvailable)
    {
        switch (message)
        {
            case RoutingMessages.ForwardToCat forwardToCat:
                if (_cats.TryGetValue(forwardToCat.Cat, out var actor))
                {
                    actor.Forward(forwardToCat.Message);
                }
                else if (stashIfNotAvailable)
                {
                    Stash.Stash();
                }
                else
                {
                    Sender.Tell(new Status.Failure(new RouteNotFoundException("Routing target is not available")));
                }
                break;

            case RoutingMessages.ForwardMessage { IsSendAndForget: false }:
                Sender.Tell(new Status.Failure(new RouteNotFoundException("Invalid route")));
                break;
        }
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case CatReady:
                Stash.UnstashAll();
                if (!_isShuttingDown)
                {
                    StartNextCat();
                }
                break;

            case CatDied died:
                logger.LogError("Bottleneko", $"Cat {died.Cat} has failed to start: {died.Exception}");
                Self.Tell(ControlMessages.Shutdown.Instance);
                break;

            case RoutingMessages.ForwardMessage forwardMessage:
                TryRoute(forwardMessage, true);
                break;

            case LoggingMessages.GetLogger:
                Sender.Tell(logger);
                break;

            case ControlMessages.Shutdown:
                logger.LogInfo("Bottleneko", "Shutting down...");
                _isShuttingDown = true;
                foreach (var cat in _cats.Values)
                {
                    cat.Tell(ControlMessages.Shutdown.Instance);
                }
                break;

            case Terminated t:
                foreach (var (catType, cat) in _cats)
                {
                    if (t.ActorRef == cat)
                    {
                        _cats.Remove(catType);
                        if (!_isShuttingDown)
                        {
                            Self.Tell(ControlMessages.Shutdown.Instance);
                        }
                        break;
                    }
                }
                
                if (_cats.Count == 0)
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
            case RoutingMessages.ForwardMessage forwardMessage:
                TryRoute(forwardMessage, false);
                break;

            case LoggingMessages.GetLogger:
                Sender.Tell(logger);
                break;

            case ControlMessages.Shutdown:
                logger.LogInfo("Bottleneko", "Shutting down...");
                _isShuttingDown = true;
                foreach (var cat in _cats.Values)
                {
                    cat.Tell(ControlMessages.Shutdown.Instance);
                }
                break;

            case Terminated t:
                foreach (var (catType, cat) in _cats)
                {
                    if (t.ActorRef == cat)
                    {
                        _cats.Remove(catType);
                        if (!_isShuttingDown)
                        {
                            Self.Tell(ControlMessages.Shutdown.Instance);
                        }
                        break;
                    }
                }
                
                if (_cats.Count == 0)
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
}
