using Bottleneko.Actors;

namespace Bottleneko.Messages;

public static class RoutingMessages
{
    public abstract record ForwardMessage(bool IsSendAndForget);
    public record ForwardToCat(CatType Cat, object Message, bool IsSendAndForget) : ForwardMessage(IsSendAndForget);
    public record ForwardToItem(long Id, object Message, bool IsSendAndForget) : ForwardMessage(IsSendAndForget);
    public record Broadcast(object Message) : ForwardMessage(true);
}
