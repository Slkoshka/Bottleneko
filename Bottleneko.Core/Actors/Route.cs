using Bottleneko.Messages;

namespace Bottleneko.Actors;

public class RouteNotFoundException(string message) : Exception(message) { }

public static class Route
{
    public abstract class RoutedMessage
    {
        internal Func<bool, object> Factory { get; }

        internal RoutedMessage(Func<bool, object> factory)
        {
            Factory = factory;
        }

        internal abstract object Build();
    }

    public class RoutedMessageReplyUnavailable : RoutedMessage
    {
        internal RoutedMessageReplyUnavailable(Func<bool, object> factory) : base(factory)
        {
        }

        internal override object Build() => Factory(true);
    }

    public class RoutedMessageNoReply : RoutedMessageReplyUnavailable
    {
        internal RoutedMessageNoReply(Func<bool, object> factory) : base(factory)
        {
        }

        public RoutedMessageWithReply<T> WithReply<T>() => new(Factory);
    }

    public class RoutedMessageWithReply<T> : RoutedMessage
    {
        internal RoutedMessageWithReply(Func<bool, object> factory) : base(factory)
        {
        }

        internal override object Build() => Factory(false);
    }

    public static RoutedMessageNoReply ToWorld(this object message) => new(isSendAndForget => message);

    public static RoutedMessageNoReply ToConnections(this object message) => new(isSendAndForget => new RoutingMessages.ForwardToCat(CatType.Connections, message, isSendAndForget));
    public static RoutedMessageReplyUnavailable ToAllConnections(this object message) => new(_ => new RoutingMessages.ForwardToCat(CatType.Connections, new RoutingMessages.Broadcast(message), false));
    public static RoutedMessageNoReply ToConnection(this object message, long id) => new(isSendAndForget => new RoutingMessages.ForwardToCat(CatType.Connections, new RoutingMessages.ForwardToItem(id, message, isSendAndForget), isSendAndForget));

    public static RoutedMessageNoReply ToScripting(this object message) => new(isSendAndForget => new RoutingMessages.ForwardToCat(CatType.Scripting, message, isSendAndForget));
    public static RoutedMessageReplyUnavailable ToAllScripts(this object message) => new(_ => new RoutingMessages.ForwardToCat(CatType.Scripting, new RoutingMessages.Broadcast(message), false));
    public static RoutedMessageNoReply ToScript(this object message, long id) => new(isSendAndForget => new RoutingMessages.ForwardToCat(CatType.Scripting, new RoutingMessages.ForwardToItem(id, message, isSendAndForget), isSendAndForget));

    public static RoutedMessageNoReply ToEventBus(this object message) => new(isSendAndForget => new RoutingMessages.ForwardToCat(CatType.EventBus, message, isSendAndForget));
}
