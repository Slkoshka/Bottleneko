using Akka.Actor;
using Bottleneko.Database;
using Bottleneko.Messages;
using Bottleneko.Utils;

namespace Bottleneko.Actors;

abstract class ContainerItem<TEntity, TUpdateMsg>(IServiceProvider services, TEntity entity, bool autoStart) : NekoActor(services)
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
        Stopping,
        ShuttingDown,
    }

    protected ItemStatus Status { get; private set; } = ItemStatus.Waiting;
    private IActorRef? _actor = null;
    private bool _delayedRestart = false;

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

    private new void Become(UntypedReceive receive)
    {
        Status = receive switch
        {
            { } when receive == OnMessage => ItemStatus.Waiting,
            { } when receive == Starting => Status == ItemStatus.Restarting ? ItemStatus.Restarting : ItemStatus.Starting,
            { } when receive == Running => ItemStatus.Running,
            { } when receive == Restarting => ItemStatus.Restarting,
            { } when receive == Stopping => ItemStatus.Stopping,
            { } when receive == ShuttingDown => ItemStatus.ShuttingDown,
            _ => throw new Exception("Invalid receive function"),
        };
        OnStatusChange(Status);
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

    private void Restart()
    {
        _actor.Tell(IControlMessage.Shutdown.Instance);
        Become(Restarting);
    }

    protected virtual bool CustomMessageHandler(object message)
    {
        return false;
    }

    protected virtual void OnStatusChange(ItemStatus status) { }

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
                _delayedRestart = true;
                break;

            case IContainerMessage.Stop:
                Stash.Stash();
                break;

            case TUpdateMsg update:
                ApplyUpdate(update);
                _delayedRestart = true;
                break;

            case IControlMessage.Shutdown:
                Stash.Stash();
                break;

            case Started started:
                Stash.UnstashAll();
                if (_delayedRestart)
                {
                    _delayedRestart = false;
                    Restart();
                }
                else
                {
                    Become(Running);
                }
                break;

            case FailedToStart failedToStart:
                Context.Unwatch(_actor);
                Context.Stop(_actor);
                _actor = null;
                Stash.UnstashAll();
                Become(OnMessage);
                break;

            case Terminated terminated:
                if (terminated.ActorRef == _actor)
                {
                    _actor = null;
                    _delayedRestart = false;
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
                Restart();
                break;

            case IContainerMessage.Stop:
                _actor.Tell(IControlMessage.Shutdown.Instance);
                Become(Stopping);
                break;

            case TUpdateMsg update:
                if (ApplyUpdate(update))
                {
                    Restart();
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
                    Start();
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

    private void Stopping(object message)
    {
        switch (message)
        {
            case IContainerMessage.Start:
                Become(Restarting);
                break;

            case IContainerMessage.Restart:
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
