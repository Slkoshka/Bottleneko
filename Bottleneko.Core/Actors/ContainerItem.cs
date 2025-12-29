using Akka.Actor;
using Bottleneko.Messages;
using Bottleneko.Utils;

namespace Bottleneko.Actors;

abstract class ContainerItem<TUpdateMsg>(IServiceProvider services, bool autoStart) : NekoActor(services), IWithTimers
    where TUpdateMsg : ContainerMessages.Update
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
            self.Tell(ContainerMessages.Start.Instance);
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
        _ = _actor.Ask(ControlMessages.Ready.Instance).PipeTo(Self, Self, result => result switch
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
        Timers.StartSingleTimer("delayed-start", ContainerMessages.Start.Instance, delay);
        Become(WaitingForStart, delay);
    }

    private void TerminateAndStart(object? requestedStart = null)
    {
        _actor.Tell(ControlMessages.Shutdown.Instance);
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
            case ContainerMessages.Start:
                Start();
                break;

            case ContainerMessages.Restart:
                Start();
                break;

            case ContainerMessages.DelayedRestart delayedRestart:
                StartDelayed(delayedRestart.Delay);
                break;

            case ContainerMessages.Stop:
                break;

            case TUpdateMsg update:
                ApplyUpdate(update);
                break;

            case ControlMessages.Shutdown:
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
            case ContainerMessages.Start:
                break;

            case ContainerMessages.Restart:
                _requestedRestart = message;
                break;

            case ContainerMessages.DelayedRestart:
                _requestedRestart = message;
                break;

            case ContainerMessages.Stop:
                Stash.Stash();
                break;

            case TUpdateMsg update:
                ApplyUpdate(update);
                _requestedRestart = true;
                break;

            case ControlMessages.Shutdown:
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
                    case ContainerMessages.Restart:
                        Start();
                        break;

                    case ContainerMessages.DelayedRestart delayedRestart:
                        StartDelayed(delayedRestart.Delay);
                        break;

                    default:
                        Become(OnMessage);
                        break;
                }
                ;
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
            case ContainerMessages.Start:
                break;

            case ContainerMessages.Restart:
                TerminateAndStart();
                break;

            case ContainerMessages.DelayedRestart delayedRestart:
                TerminateAndStart(delayedRestart);
                break;

            case ContainerMessages.Stop:
                _actor.Tell(ControlMessages.Shutdown.Instance);
                Become(Stopping);
                break;

            case TUpdateMsg update:
                if (ApplyUpdate(update))
                {
                    TerminateAndStart();
                }
                break;

            case ControlMessages.Shutdown:
                _actor.Tell(ControlMessages.Shutdown.Instance);
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
            case ContainerMessages.Start:
                break;

            case ContainerMessages.Restart:
                _requestedStart = null;
                break;

            case ContainerMessages.DelayedRestart delayedRestart:
                _requestedStart = delayedRestart;
                break;

            case ContainerMessages.Stop:
                Stash.UnstashAll();
                Become(Stopping);
                break;

            case TUpdateMsg update:
                ApplyUpdate(update);
                break;

            case ControlMessages.Shutdown:
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
                        case ContainerMessages.DelayedRestart delayedRestart:
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
            case ContainerMessages.Start:
                Timers.Cancel("delayed-start");
                Start();
                break;

            case ContainerMessages.Restart:
                Timers.Cancel("delayed-start");
                Start();
                break;

            case ContainerMessages.DelayedRestart delayedRestart:
                StartDelayed(delayedRestart.Delay);
                break;

            case ContainerMessages.Stop:
                Timers.Cancel("delayed-start");
                Become(OnMessage);
                break;

            case TUpdateMsg update:
                ApplyUpdate(update);
                break;

            case ControlMessages.Shutdown:
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
            case ContainerMessages.Start:
                _requestedStart = null;
                Become(Restarting);
                break;

            case ContainerMessages.Restart:
                _requestedStart = null;
                Become(Restarting);
                break;

            case ContainerMessages.DelayedRestart delayedRestart:
                _requestedStart = delayedRestart;
                Become(Restarting);
                break;

            case ContainerMessages.Stop:
                break;

            case TUpdateMsg update:
                ApplyUpdate(update);
                break;

            case ControlMessages.Shutdown:
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
            case ControlMessages.Shutdown:
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
