using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Scripting.Bindings;
using Bottleneko.Utils;

namespace Bottleneko.Messages;

public interface IHandledByConnection { }

public static class ConnectionMessages
{
    public record Add(string Name, Protocol Protocol, bool AutoStart, ProtocolConfiguration Configuration) : ContainerMessages.Add;
    public record Update(long Id, string? Name, bool? AutoStart, ProtocolConfiguration? Configuration) : ContainerMessages.Update(Id);
    public record Remove(long Id) : ContainerMessages.Remove(Id);

    public record GetStatus() : SingletonMessage<GetStatus>;
    public record GetBinding() : SingletonMessage<GetBinding>;
    public record GetAttachment(long AttachmentId) : IHandledByConnection;
    public record ProxyUpdated(long ProxyId) : IHandledByConnection;
    public record SimpleReply(ChatMessageBinding ReplyTo, string Text) : IHandledByConnection;
    public record SendMessage(ChatBinding Chat, string Text) : IHandledByConnection;
}
