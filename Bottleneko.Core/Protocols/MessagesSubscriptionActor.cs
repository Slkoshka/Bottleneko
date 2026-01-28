using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Rpc;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Messages;
using Bottleneko.Services;
using Microsoft.EntityFrameworkCore;

namespace Bottleneko.Protocols;

public class MessagesSubscriptionActor(IServiceProvider services, AkkaService akka, IActorRef connection, ChatMessageFilter filter, SubscriptionId subscriptionId, bool includeHistory) : SubscriptionActor(services, connection, subscriptionId)
{
    private bool _isInitialSend = includeHistory;
    private long? _lastMessageId;

    public override async Task InitAsync(IActorRef self)
    {
        _ = await akka.AskAsync(new EventBusMessages.Subscribe(self, "internal/connection/message_received").ToEventBus().WithReply<object>());

        await base.InitAsync(self);
    }

    protected override async IAsyncEnumerable<Letter[]> GetNewMessagesAsync()
    {
        await using var db = NekoDbContext.Get();
        var newMessages = await db.ChatMessages.OrderByDescending(m => m.Id).Where(m => (!_lastMessageId.HasValue || m.Id > _lastMessageId.Value) && (filter.ConnectionId == null || m.ConnectionId == long.Parse(filter.ConnectionId))).Take(100).ToArrayAsync();
        if (newMessages.Length > 0)
        {
            yield return newMessages.Select(msg => new ChatMessageLetter(msg.ToDto())).Cast<Letter>().ToArray();
            _lastMessageId = newMessages[0].Id;
        }

        if (_isInitialSend)
        {
            yield return [];
            _isInitialSend = false;
        }
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case EventBusMessages.Event { Payload: ChatMessageEntity }:
                HasNewMessages();
                break;

            default:
                base.OnMessage(message);
                break;
        }
    }
}
