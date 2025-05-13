using Bottleneko.Utils;

namespace Bottleneko.Messages;

public interface IControlMessage
{
    public record Ready : SingletonMessage<Ready>, IControlMessage, IHasReply;
    public record Shutdown : SingletonMessage<Shutdown>, IControlMessage;
}
