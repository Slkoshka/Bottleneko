using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Messages;
using Bottleneko.Utils;

namespace Bottleneko.Actors;

public abstract class SubscriptionActor(IServiceProvider services, IActorRef connection, SubscriptionId subscriptionId) : NekoActor(services), IWithTimers
{
    record InitialSend : SingletonMessage<InitialSend>;
    record SendNewMessages : SingletonMessage<SendNewMessages>;
    record SendMessagesFinished : SingletonMessage<SendMessagesFinished>;

    public ITimerScheduler Timers { get; set; } = null!;

    private bool _hasPendingMessages = false;
    private bool _isSendingMessages = false;

    public override Task InitAsync(IActorRef self)
    {
        self.Tell(InitialSend.Instance);

        return Task.CompletedTask;
    }

    protected abstract IAsyncEnumerable<Letter[]> InitialMessagesAsync();
    protected abstract IAsyncEnumerable<Letter[]> GetNewMessagesAsync();

    private async Task SendInitialMessagesAsync()
    {
        await foreach (var mail in InitialMessagesAsync())
        {
            connection.Tell(new RpcMessages.SendPacket(new MailPacket(subscriptionId, mail)));
        }
    }

    private async Task SendMessagesAsync()
    {
        await foreach (var mail in GetNewMessagesAsync())
        {
            connection.Tell(new RpcMessages.SendPacket(new MailPacket(subscriptionId, mail)));
        }
    }

    protected void HasNewMessages()
    {
        Timers.StartSingleTimer("sendThrottle", SendNewMessages.Instance, TimeSpan.FromMilliseconds(250));
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case InitialSend:
                _hasPendingMessages = false;
                _isSendingMessages = true;
                _ = SendInitialMessagesAsync().PipeTo(Self, Self, () => SendMessagesFinished.Instance);
                break;

            case SendNewMessages:
                if (_isSendingMessages)
                {
                    _hasPendingMessages = true;
                }
                else
                {
                    _hasPendingMessages = false;
                    _isSendingMessages = true;
                    _ = SendMessagesAsync().PipeTo(Self, Self, () => SendMessagesFinished.Instance);
                }
                break;

            case SendMessagesFinished:
                _isSendingMessages = false;
                if (_hasPendingMessages)
                {
                    _hasPendingMessages = false;
                    Timers.StartSingleTimer("sendThrottle", SendNewMessages.Instance, TimeSpan.FromMilliseconds(250));
                }
                break;

            case ControlMessages.Shutdown:
                Context.Stop(Self);
                break;

            default:
                Unhandled(message);
                break;
        }
    }
}

