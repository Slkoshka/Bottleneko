using Akka.Actor;
using Bottleneko.Database;
using Bottleneko.Messages;
using Bottleneko.Utils;

namespace Bottleneko.Actors;

abstract class ContainerItem<TEntity, TUpdateMsg>(IServiceProvider services, TEntity entity, bool autoStart) : NekoActor(services), IWithTimers
    where TEntity : Entity
    where TUpdateMsg: IContainerMessage.Update
{
    record Started : SingletonMessage<Started>;
    record FailedToStart(Exception Exception);

    protected enum ItemStatus
    {
        Waiting,
        Starting,
        Running,
        Restarting,
        DelayedRestart,
        Stopping,
        ShuttingDown,
    }

    public ITimerScheduler Timers { get; set; } = null!;
    protected ItemStatus Status { get; private set; } = ItemStatus.Waiting;
    private IActorRef? _actor = null;

    private object? _requestedRestart = null;
    private object? _requestedStart = null;

    public override async Task InitAsync(IActorRef self)
    {
        if (autoStart)
        {
            self.Tell(new IContainerMessage.Start(entity.Id));
        }
        await base.InitAsync(self);
    }

    protected abstract IActorRef CreateActor();
    protected abstract bool ApplyUpdate(TUpdateMsg update);

    private void Become(UntypedReceive receive, TimeSpan delay = default)
    {
        Status = receive switch
        {
            { } when receive == OnMessage => ItemStatus.Waiting,
            { } when receive == Starting => Status == ItemStatus.Restarting ? ItemStatus.Restarting : ItemStatus.Starting,
            { } when receive == Running => ItemStatus.Running,
            { } when receive == Restarting => ItemStatus.Restarting,
            { } when receive == WaitingForStart => ItemStatus.DelayedRestart,
            { } when receive == Stopping => ItemStatus.Stopping,
            { } when receive == ShuttingDown => ItemStatus.ShuttingDown,
            _ => throw new Exception("Invalid receive function"),
        };
        OnStatusChange(Status, delay);
        base.Become(receive);
    }

    private void Start()
    {
        _actor = CreateActor();
        _ = _actor.Ask(IControlMessage.Ready.Instance).PipeTo(Self, Self, result => result switch
        {
            Status.Success _ => Started.Instance,
            Status.Failure failure => new FailedToStart(failure.Cause),
            _ => new FailedToStart(new Exception("Unknown error")),
        }, ex => new FailedToStart(ex));
        Context.Watch(_actor);
        Become(Starting);
    }

    private void StartDelayed(TimeSpan delay)
    {
        Timers.StartSingleTimer("delayed-start", new IContainerMessage.Start(entity.Id), delay);
        Become(WaitingForStart, delay);
    }

    private void TerminateAndStart(object? requestedStart = null)
    {
        _actor.Tell(IControlMessage.Shutdown.Instance);
        _requestedStart = requestedStart;
        Become(Restarting);
    }

    protected virtual bool CustomMessageHandler(object message)
    {
        return false;
    }

    protected virtual void OnStatusChange(ItemStatus status, TimeSpan delay) { }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case IContainerMessage.Start:
                Start();
                break;

            case IContainerMessage.Restart:
                Start();
                break;

            case IContainerMessage.DelayedRestart delayedRestart:
                StartDelayed(delayedRestart.Delay);
                break;

            case IContainerMessage.Stop:
                break;

            case TUpdateMsg update:
                ApplyUpdate(update);
                break;

            case IControlMessage.Shutdown:
                Context.Stop(Self);
                break;

            default:
                if (!CustomMessageHandler(message))
                {
                    Unhandled(message);
                }
                break;
        }
    }

    private void Starting(object message)
    {
        switch (message)
        {
            case IContainerMessage.Start:
                break;

            case IContainerMessage.Restart:
                _requestedRestart = message;
                break;

            case IContainerMessage.DelayedRestart:
                _requestedRestart = message;
                break;

            case IContainerMessage.Stop:
                Stash.Stash();
                break;

            case TUpdateMsg update:
                ApplyUpdate(update);
                _requestedRestart = true;
                break;

            case IControlMessage.Shutdown:
                Stash.Stash();
                break;

            case Started started:
                Stash.UnstashAll();
                switch (_requestedRestart)
                {
                    case null:
                        Become(Running);
                        break;

                    default:
                        TerminateAndStart(_requestedRestart);
                        break;
                }
                _requestedRestart = null;

                break;

            case FailedToStart failedToStart:
                Context.Unwatch(_actor);
                Context.Stop(_actor);
                _actor = null;
                Stash.UnstashAll();

                switch (_requestedRestart)
                {
                    case IContainerMessage.Restart:
                        Start();
                        break;

                    case IContainerMessage.DelayedRestart delayedRestart:
                        StartDelayed(delayedRestart.Delay);
                        break;

                    default:
                        Become(OnMessage);
                        break;
                };
                _requestedRestart = null;

                break;

            case Terminated terminated:
                if (terminated.ActorRef == _actor)
                {
                    _actor = null;
                    _requestedRestart = null;
                    Stash.UnstashAll();
                    Become(OnMessage);
                }
                break;

            default:
                if (!CustomMessageHandler(message))
                {
                    Stash.Stash();
                }
                break;
        }
    }

    private void Running(object message)
    {
        switch (message)
        {
            case IContainerMessage.Start:
                break;

            case IContainerMessage.Restart:
                TerminateAndStart();
                break;

            case IContainerMessage.DelayedRestart delayedRestart:
                TerminateAndStart(delayedRestart);
                break;

            case IContainerMessage.Stop:
                _actor.Tell(IControlMessage.Shutdown.Instance);
                Become(Stopping);
                break;

            case TUpdateMsg update:
                if (ApplyUpdate(update))
                {
                    TerminateAndStart();
                }
                break;

            case IControlMessage.Shutdown:
                _actor.Tell(IControlMessage.Shutdown.Instance);
                Become(ShuttingDown);
                break;

            case Terminated terminated:
                if (terminated.ActorRef == _actor)
                {
                    _actor = null;
                    Become(OnMessage);
                }
                break;

            default:
                if (!CustomMessageHandler(message))
                {
                    _actor.Forward(message);
                }
                break;
        }
    }

    private void Restarting(object message)
    {
        switch (message)
        {
            case IContainerMessage.Start:
                break;

            case IContainerMessage.Restart:
                _requestedStart = null;
                break;

            case IContainerMessage.DelayedRestart delayedRestart:
                _requestedStart = delayedRestart;
                break;

            case IContainerMessage.Stop:
                Stash.UnstashAll();
                Become(Stopping);
                break;

            case TUpdateMsg update:
                ApplyUpdate(update);
                break;

            case IControlMessage.Shutdown:
                Stash.UnstashAll();
                Become(ShuttingDown);
                break;

            case Terminated terminated:
                if (terminated.ActorRef == _actor)
                {
                    _actor = null;
                    Stash.UnstashAll();
                    switch (_requestedStart)
                    {
                        case IContainerMessage.DelayedRestart delayedRestart:
                            StartDelayed(delayedRestart.Delay);
                            break;

                        default:
                            Start();
                            break;
                    }
                }
                break;

            default:
                if (!CustomMessageHandler(message))
                {
                    Stash.Stash();
                }
                break;
        }
    }

    private void WaitingForStart(object message)
    {
        switch (message)
        {
            case IContainerMessage.Start:
                Timers.Cancel("delayed-start");
                Start();
                break;

            case IContainerMessage.Restart:
                Timers.Cancel("delayed-start");
                Start();
                break;

            case IContainerMessage.DelayedRestart delayedRestart:
                StartDelayed(delayedRestart.Delay);
                break;

            case IContainerMessage.Stop:
                Timers.Cancel("delayed-start");
                Become(OnMessage);
                break;

            case TUpdateMsg update:
                ApplyUpdate(update);
                break;

            case IControlMessage.Shutdown:
                Context.Stop(Self);
                break;

            default:
                if (!CustomMessageHandler(message))
                {
                    Unhandled(message);
                }
                break;
        }
    }

    private void Stopping(object message)
    {
        switch (message)
        {
            case IContainerMessage.Start:
                _requestedStart = null;
                Become(Restarting);
                break;

            case IContainerMessage.Restart:
                _requestedStart = null;
                Become(Restarting);
                break;

            case IContainerMessage.DelayedRestart delayedRestart:
                _requestedStart = delayedRestart;
                Become(Restarting);
                break;

            case IContainerMessage.Stop:
                break;

            case TUpdateMsg update:
                ApplyUpdate(update);
                break;

            case IControlMessage.Shutdown:
                Become(ShuttingDown);
                break;

            case Terminated terminated:
                if (terminated.ActorRef == _actor)
                {
                    _actor = null;
                    Become(OnMessage);
                }
                break;

            default:
                if (!CustomMessageHandler(message))
                {
                    Unhandled(message);
                }
                break;
        }
    }

    private void ShuttingDown(object message)
    {
        switch (message)
        {
            case IControlMessage.Shutdown:
                break;

            case Terminated terminated:
                if (terminated.ActorRef == _actor)
                {
                    Context.Stop(Self);
                }
                break;

            default:
                if (!CustomMessageHandler(message))
                {
                    Unhandled(message);
                }
                break;
        }
    }
}
