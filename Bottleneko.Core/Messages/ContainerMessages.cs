using Bottleneko.Utils;

namespace Bottleneko.Messages;

public static class ContainerMessages
{
    public abstract record Add;
    public abstract record Update(long Id);
    public abstract record Remove(long Id);

    public record Start() : SingletonMessage<Start>;
    public record Restart() : SingletonMessage<Restart>;
    public record DelayedRestart(TimeSpan Delay);
    public record Stop() : SingletonMessage<Stop>;
}
