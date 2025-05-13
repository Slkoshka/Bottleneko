using Akka.Actor;

namespace Bottleneko.Messages;

public interface IEventBusMessage
{
    public delegate Task EventListener(string name, object payload);

    public record Publish(string Name, object Payload) : IEventBusMessage;
    public record Event(string Name, object Payload) : IEventBusMessage;
    public record Subscribe(IActorRef Listener, string? Name = null, Type? PayloadType = null) : IEventBusMessage, IHasReply;
    public record SubscribeExternal(object Token, EventListener Listener, string? Name = null, Type? PayloadType = null) : IEventBusMessage;
    public record Unsubscribe(object Token) : IEventBusMessage;
}
