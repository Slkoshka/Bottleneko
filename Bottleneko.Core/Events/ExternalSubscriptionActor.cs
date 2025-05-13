using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Utils;

namespace Bottleneko.Events;

class ExternalSubscriptionActor(IServiceProvider services, INekoLogger logger, IActorRef eventBus, IEventBusMessage.EventListener handler, IEventBusMessage.SubscribeExternal subscription) : NekoActor(services)
{
    record SubscriptionAcquired(object Token);
    record HandlerDone : SingletonMessage<HandlerDone>;

    private object? _token = null;

    public override async Task InitAsync(IActorRef self)
    {
        _ = eventBus.Ask(new IEventBusMessage.Subscribe(self, subscription.Name, subscription.PayloadType)).PipeTo(self, eventBus, token => new SubscriptionAcquired(token));
        await base.InitAsync(self);
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case SubscriptionAcquired subscriptionAcquired:
                _token = subscriptionAcquired.Token;
                Stash.UnstashAll();
                Become(OnWaiting);
                break;

            default:
                Stash.Stash();
                break;
        }
    }

    private void OnWaiting(object message)
    {
        switch (message)
        {
            case IEventBusMessage.Event @event:
                _ = handler(@event.Name, @event.Payload).PipeTo(Self, Self, () => HandlerDone.Instance);
                Become(Handling);
                break;

            case IControlMessage.Shutdown:
                if (_token is not null)
                {
                    eventBus.Tell(new IEventBusMessage.Unsubscribe(_token));
                    _token = null;
                }
                Context.Stop(Self);
                break;

            default:
                Unhandled(message);
                break;
        }
    }

    private void Handling(object message)
    {
        switch (message)
        {
            case HandlerDone:
                Stash.UnstashAll();
                Become(OnWaiting);
                break;

            case Status.Failure failure:
                logger.LogError("Bottleneko.EventBus", "An error has occured in an event handler", failure.Cause);
                Stash.UnstashAll();
                Become(OnWaiting);
                break;

            case IControlMessage.Shutdown:
                if (_token is not null)
                {
                    eventBus.Tell(new IEventBusMessage.Unsubscribe(_token));
                    _token = null;
                }
                Context.Stop(Self);
                break;

            default:
                Stash.Stash();
                break;
        }
    }
}
