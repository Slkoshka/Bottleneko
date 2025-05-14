namespace Bottleneko.Messages;

public interface IContainerMessage
{
    public abstract record BroadcastItemMessage : IContainerMessage;
    public abstract record ContainerItemMessage(long Id) : IContainerMessage;

    public abstract record Add : IContainerMessage;
    public abstract record Update(long Id);
    public abstract record Remove(long Id);

    public record Start(long Id) : ContainerItemMessage(Id);
    public record Restart(long Id) : ContainerItemMessage(Id);
    public record Stop(long Id) : ContainerItemMessage(Id);
}
