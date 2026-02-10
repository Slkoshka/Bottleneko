using Akka.Actor;

namespace Bottleneko.Messages;

public static class EventBusMessages
{
    public delegate Task EventListener(string name, object payload);

    public record Publish(string Name, object Payload);
    public record Event(string Name, object Payload);
    public record Subscribe(IActorRef Listener, string? Name = null, Type? PayloadType = null);
    public record SubscribeExternal(object Token, EventListener Listener, string? Name = null, Type? PayloadType = null);
    public record Unsubscribe(object Token);
}
