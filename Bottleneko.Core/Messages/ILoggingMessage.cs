using Bottleneko.Api.Packets;

namespace Bottleneko.Messages;

public interface ILoggingMessage
{
    public record GetLogger(LogFilter Filter) : ILoggingMessage, IHasReply;
}
