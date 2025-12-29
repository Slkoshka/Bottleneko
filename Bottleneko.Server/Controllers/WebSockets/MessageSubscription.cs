using Bottleneko.Actors;
using Bottleneko.Api.Packets;
using Bottleneko.Database;
using Bottleneko.Messages;
using Bottleneko.Server.Utils;
using Bottleneko.Services;
using Microsoft.EntityFrameworkCore;
using System.Net.WebSockets;
using System.Runtime.CompilerServices;

namespace Bottleneko.Server.Controllers.WebSockets;

public class MessageSubscription : Subscription
{
    private readonly AkkaService _akka;
    private bool _isInitialSend = true;
    private readonly ChatMessageFilter _filter;
    private long? _lastMessageId = null;

    private readonly object _eventSubscription = new();

    public MessageSubscription(IServiceProvider services, ChatMessagesSubscriptionTopic topic, string subscriptionId, WebSocketHandler wsHandler, WebSocket ws) : base(subscriptionId, wsHandler, ws)
    {
        _akka = services.GetRequiredService<AkkaService>();
        _filter = topic.Filter;

        _akka.Tell(new EventBusMessages.SubscribeExternal(_eventSubscription, OnNewEventAsync, "internal/connection/message_received").ToEventBus());
    }

    private Task OnNewEventAsync(string name, object @event)
    {
        return SendMessagesAsync();
    }

    protected override async IAsyncEnumerable<Letter[]> GetNewMessagesAsync([EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await using var db = NekoDbContext.Get();
        var newMessages = await db.ChatMessages.OrderByDescending(m => m.Id).Where(m => (!_lastMessageId.HasValue || m.Id > _lastMessageId.Value) && (_filter.ConnectionId == null || m.ConnectionId == long.Parse(_filter.ConnectionId))).Take(100).ToArrayAsync(cancellationToken);
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

    public override ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        _akka.Tell(new EventBusMessages.Unsubscribe(_eventSubscription).ToEventBus());
        return base.DisposeAsync();
    }
}
