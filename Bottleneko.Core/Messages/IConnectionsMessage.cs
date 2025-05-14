using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Scripting.Bindings;

namespace Bottleneko.Messages;

public interface IConnectionsMessage : IContainerMessage
{
    public new record Add(string Name, Protocol Protocol, bool AutoStart, ProtocolConfiguration Configuration) : IContainerMessage.Add, IConnectionsMessage;
    public new record Update(long Id, string? Name, bool? AutoStart, ProtocolConfiguration? Configuration) : IContainerMessage.Update(Id), IConnectionsMessage;
    public new record Remove(long Id) : IContainerMessage.Remove(Id), IConnectionsMessage;
    public new record Start(long Id) : IContainerMessage.Start(Id), IConnectionsMessage;
    public new record Restart(long Id) : IContainerMessage.Restart(Id), IConnectionsMessage;
    public new record Stop(long Id) : IContainerMessage.Stop(Id), IConnectionsMessage;
    public record GetStatus(long Id) : IConnectionsMessage, IHasReply;

    public record Get(long Id) : ContainerItemMessage(Id), IConnectionsMessage;
    public record GetAttachment(long Id, long AttachmentId) : ContainerItemMessage(Id), IConnectionsMessage, IHasReply;
    public record ProxyUpdated(long Id) : BroadcastItemMessage, IConnectionsMessage;
    public record SimpleReply(long Id, ChatMessageBinding ReplyTo, string Text) : ContainerItemMessage(Id), IConnectionsMessage;
    public record SendMessage(long Id, ChatBinding Chat, string Text) : ContainerItemMessage(Id), IConnectionsMessage;
}
