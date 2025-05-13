using System.Net.WebSockets;
using System.Runtime.CompilerServices;
using Bottleneko.Api.Packets;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Services;

namespace Bottleneko.Server.Controllers.WebSockets;

public class LogSubscription : Subscription
{
    private readonly AkkaService _akka;

    private readonly LogMessageEvent[] _logEventBuffer = new LogMessageEvent[256];
    private readonly object _eventSubscription = new();
    private readonly LogsSubscriptionTopic _topic;
    private LogRouter? _logger = null;

    private bool _isInitialSend = true;
    private string? _lastMessageId;

    public LogSubscription(IServiceProvider services, LogsSubscriptionTopic topic, string subscriptionId, WebSocketHandler wsHandler, WebSocket ws) : base(subscriptionId, wsHandler, ws)
    {
        _akka = services.GetRequiredService<AkkaService>();
        _topic = topic;
        _akka.Tell(new IEventBusMessage.SubscribeExternal(_eventSubscription, OnNewEventAsync, "internal/log/message"));
    }

    private Task OnNewEventAsync(object sender, object logEvent)
    {
        return SendMessagesAsync();
    }

    protected override async IAsyncEnumerable<Letter[]> GetNewMessagesAsync([EnumeratorCancellation] CancellationToken cancellationToken)
    {
        _logger ??= await _akka.AskAsync<LogRouter>(new ILoggingMessage.GetLogger(_topic.Filter));

        var filter = new LogMessageHistoryFilter(_topic.Filter);
        var count = _isInitialSend ? _logger.Buffer.GetLast(_logEventBuffer.AsMemory(), filter) : _logger.Buffer.GetSince(_lastMessageId, _logEventBuffer.AsMemory(), filter);
        if (count > 0)
        {
            var items = _isInitialSend ? _logEventBuffer.Skip(_logEventBuffer.Length - count) : _logEventBuffer.Take(count);
            yield return items.Select(logEvent =>
                new LogLetter(logEvent.Id, logEvent.Timestamp, logEvent.Severity, logEvent.SourceType, logEvent.SourceId, logEvent.Category, (string.IsNullOrWhiteSpace(logEvent.Message), logEvent.Exception) switch
                {
                    (true, not null) => logEvent.Exception.ToString(),
                    (false, null) => logEvent.Message!,
                    (false, not null) => $"{logEvent.Message}\n\n{logEvent.Exception}",
                    _ => string.Empty,
                })).Cast<Letter>().Reverse().ToArray();
            _lastMessageId = _isInitialSend ? _logEventBuffer[^1].Id : _logEventBuffer[count - 1].Id;
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
        _akka.Tell(new IEventBusMessage.Unsubscribe(_eventSubscription));
        return base.DisposeAsync();
    }
}
