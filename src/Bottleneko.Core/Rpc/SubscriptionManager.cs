using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Messages;

namespace Bottleneko.Rpc;

public class SubscriptionManager
{
    private readonly Lock @lock = new();
    private readonly Dictionary<IActorRef, Dictionary<SubscriptionId, IActorRef>> _subscriptions = [];

    public void OnConnectionClosed(IActorRef connection)
    {
        lock (@lock)
        {
            if (_subscriptions.Remove(connection, out var subscriptions))
            {
                foreach (var actor in subscriptions.Values)
                {
                    actor.Tell(ControlMessages.Shutdown.Instance);
                }
            }
        }
    }

    public async Task<SubscriptionId> SubscribeAsync(IActorRef connection, Func<SubscriptionId, Task<IActorRef>> subscribe)
    {
        var subscriptionId = new SubscriptionId(Guid.NewGuid().ToString("N"));
        var subscriptionActor = await subscribe(subscriptionId);

        lock (@lock)
        {
            if (!_subscriptions.TryGetValue(connection, out var subscriptions))
            {
                subscriptions = _subscriptions[connection] = [];
            }
            subscriptions.Add(subscriptionId, subscriptionActor);

            return subscriptionId;
        }
    }

    public void Unsubscribe(IActorRef connection, SubscriptionId subscriptionId)
    {
        lock (@lock)
        {
            if (_subscriptions.TryGetValue(connection, out var subscriptions))
            {
                if (subscriptions.Remove(subscriptionId, out var actor))
                {
                    actor.Tell(ControlMessages.Shutdown.Instance);
                }
            }
        }
    }
}
