using Bottleneko.Utils;

namespace Bottleneko.Messages;

public static class ControlMessages
{
    public record Ready : SingletonMessage<Ready>;
    public record Shutdown : SingletonMessage<Shutdown>;
}
