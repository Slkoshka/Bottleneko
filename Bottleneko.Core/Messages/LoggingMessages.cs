using Bottleneko.Utils;

namespace Bottleneko.Messages;

public static class LoggingMessages
{
    public record GetLogger() : SingletonMessage<GetLogger>;
}
