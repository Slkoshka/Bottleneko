using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Messages;

namespace Bottleneko.Events;

class EventBusCat(IServiceProvider services) : NekoActor(services)
{
    public delegate bool EventFilter<in T>(string? eventName, T args);

    enum SubscriptionType
    {
        Generic,
        ExactName,
        ExactType,
        ExactNameType,
    }

    record Subscription(IActorRef Listener, List<Subscription> Collection, SubscriptionType Type, EventFilter<object>? Filter = null);

    private readonly Dictionary<object, IActorRef> _externalSubscriptions = [];
    private readonly List<Subscription> _genericSubscriptions = [];
    private readonly Dictionary<string, List<Subscription>> _exactNameSubscriptions = [];
    private readonly Dictionary<Type, List<Subscription>> _typeSubscriptions = [];
    private readonly Dictionary<(string Name, Type PayloadType), List<Subscription>> _exactNameTypeSubscriptions = [];

    private Subscription AddSubscription(IActorRef listener, string? name = null, Type? payloadType = null)
    {
        switch ((name, payloadType))
        {
            case (null, null):
                {
                    var sub = new Subscription(listener, _genericSubscriptions, SubscriptionType.Generic, null);
                    _genericSubscriptions.Add(sub);
                    return sub;
                }

            case (not null, null):
                {
                    if (!_exactNameSubscriptions.TryGetValue(name, out var subs))
                    {
                        subs = _exactNameSubscriptions[name] = [];
                    }
                    var sub = new Subscription(listener, subs, SubscriptionType.ExactName, null);
                    subs.Add(sub);
                    return sub;
                }

            case (null, not null):
                {
                    if (!_typeSubscriptions.TryGetValue(payloadType, out var subs))
                    {
                        subs = _typeSubscriptions[payloadType] = [];
                    }
                    var sub = new Subscription(listener, subs, SubscriptionType.ExactType, null);
                    subs.Add(sub);
                    return sub;
                }

            case (not null, not null):
                {
                    if (!_exactNameTypeSubscriptions.TryGetValue((name, payloadType), out var subs))
                    {
                        subs = _exactNameTypeSubscriptions[(name, payloadType)] = [];
                    }
                    var sub = new Subscription(listener, subs, SubscriptionType.ExactNameType, null);
                    subs.Add(sub);
                    return sub;
                }
        }
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case IEventBusMessage.Subscribe subscribe:
                Sender.Tell(AddSubscription(subscribe.Listener, subscribe.Name, subscribe.PayloadType));
                break;

            case IEventBusMessage.SubscribeExternal external:
                _externalSubscriptions[external.Token] = CreateChild<ExternalSubscriptionActor>([Self, external.Listener, external]);
                break;

            case IEventBusMessage.Publish publish:
                {
                    var @event = new IEventBusMessage.Event(publish.Name, publish.Payload);
                    IEnumerable<Subscription> matchingSubs = _genericSubscriptions;
                    if (_exactNameSubscriptions.TryGetValue(publish.Name, out var subs))
                    {
                        matchingSubs = matchingSubs.Concat(subs);
                    }
                    Type? type = publish.Payload.GetType();
                    while (type is not null)
                    {
                        if (_typeSubscriptions.TryGetValue(type, out subs))
                        {
                            matchingSubs = matchingSubs.Concat(subs);
                        }
                        if (_exactNameTypeSubscriptions.TryGetValue((publish.Name, type), out subs))
                        {
                            matchingSubs = matchingSubs.Concat(subs);
                        }
                        type = type.BaseType;
                    }
                    foreach (var sub in matchingSubs.Where(sub => sub.Filter?.Invoke(publish.Name, publish.Payload) ?? true))
                    {
                        sub.Listener.Tell(@event);
                    }
                    break;
                }

            case IEventBusMessage.Unsubscribe unsubscribe:
                {
                    if (_externalSubscriptions.Remove(unsubscribe.Token, out var externalActor))
                    {
                        externalActor.Tell(IControlMessage.Shutdown.Instance);
                    }
                    else
                    {
                        var sub = (Subscription)unsubscribe.Token;
                        sub.Collection.Remove(sub);
                    }
                    break;
                }

            case IControlMessage.Shutdown:
                Context.Stop(Self);
                break;

            case Terminated t:
                _genericSubscriptions.RemoveAll(sub => sub.Listener == t.ActorRef);
                foreach (var subs in _exactNameSubscriptions.Values)
                {
                    subs.RemoveAll(sub => sub.Listener == t.ActorRef);
                }
                foreach (var subs in _typeSubscriptions.Values)
                {
                    subs.RemoveAll(sub => sub.Listener == t.ActorRef);
                }
                foreach (var subs in _exactNameTypeSubscriptions.Values)
                {
                    subs.RemoveAll(sub => sub.Listener == t.ActorRef);
                }
                break;

            default:
                Unhandled(message);
                break;
        }
    }
}
