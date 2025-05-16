using Akka.Actor;
using Akka.DependencyInjection;
using Bottleneko.Messages;
using Bottleneko.Utils;
using Microsoft.Extensions.DependencyInjection;

namespace Bottleneko.Actors;

public abstract class NekoActor(IServiceProvider services) : UntypedActorWithStash
{
    record InitSuccess : SingletonMessage<InitSuccess>;
    record InitFailure(Exception Exception);

    public IServiceScope Scope { get; } = services.CreateScope();
    public IServiceProvider Services => Scope.ServiceProvider;
    public static DependencyResolver Resolver => DependencyResolver.For(Context.System);

    protected sealed override void PreStart()
    {
        _ = InitAsync(Self).PipeTo(Self, Sender, success: () => InitSuccess.Instance, failure: ex => new InitFailure(ex));
    }

    protected sealed override void OnReceive(object message)
    {
        switch (message)
        {
            case InitSuccess:
                Stash.UnstashAll();
                Become(OnMessage);
                break;

            case InitFailure failure:
                Stash.UnstashAll();
                Become(FailedToStart(failure.Exception));
                break;

            default:
                Stash.Stash();
                break;
        }
    }

    private UntypedReceive FailedToStart(Exception ex)
    {
        return msg =>
        {
            switch (msg)
            {
                case IControlMessage.Ready:
                    Sender.Tell(new Status.Failure(ex));
                    break;

                case IControlMessage.Shutdown:
                    Context.Stop(Self);
                    break;

                default:
                    base.Unhandled(msg);
                    break;
            }
        };
    }

    protected override void Unhandled(object message)
    {
        switch (message)
        {
            case IControlMessage.Ready:
                Sender.Tell(Status.Success.Instance, Self);
                break;

            default:
                base.Unhandled(message);
                break;
        }
    }

    public virtual Task InitAsync(IActorRef self)
    {
        return Task.CompletedTask;
    }

    protected static IActorRef CreateChild<T>(object?[] args, string? name = null) where T: ActorBase
    {
        return Context.ActorOf(Resolver.Props<T>(args), name);
    }

    protected abstract void OnMessage(object message);

    protected override void PostStop()
    {
        Scope.Dispose();
    }
}
