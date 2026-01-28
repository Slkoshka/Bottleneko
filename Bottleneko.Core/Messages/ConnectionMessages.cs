using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Utils;

namespace Bottleneko.Messages;

public interface IHandledByConnection { }

public static class ConnectionMessages
{
    public record Add(string Name, Protocol Protocol, bool AutoStart, ProtocolConfiguration Configuration) : ContainerMessages.Add;
    public record Update(long Id, string? Name, bool? AutoStart, ProtocolConfiguration? Configuration) : ContainerMessages.Update(Id);
    public record Remove(long Id) : ContainerMessages.Remove(Id);

    public record GetStatus() : SingletonMessage<GetStatus>;
    public record GetAttachment(long AttachmentId) : IHandledByConnection;
    public record ProxyUpdated(long ProxyId) : IHandledByConnection;
}
