using Bottleneko.Actors;
using Bottleneko.Api.Packets;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Services;
using System.Net.WebSockets;
using System.Runtime.CompilerServices;

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
        _akka.Tell(new EventBusMessages.SubscribeExternal(_eventSubscription, OnNewEventAsync, "internal/log/message").ToEventBus());
    }

    private Task OnNewEventAsync(object sender, object logEvent)
    {
        return SendMessagesAsync();
    }

    protected override async IAsyncEnumerable<Letter[]> GetNewMessagesAsync([EnumeratorCancellation] CancellationToken cancellationToken)
    {
        _logger ??= _topic.Filter switch
        {
            { SourceType: LogSourceType.Connection, SourceId: null } => await _akka.AskAsync(LoggingMessages.GetLogger.Instance.ToConnections().WithReply<LogRouter>()),
            { SourceType: LogSourceType.Connection } => await _akka.AskAsync(LoggingMessages.GetLogger.Instance.ToConnection(long.Parse(_topic.Filter.SourceId)).WithReply<LogRouter>()),
            { SourceType: LogSourceType.Script, SourceId: null } => await _akka.AskAsync(LoggingMessages.GetLogger.Instance.ToScripting().WithReply<LogRouter>()),
            { SourceType: LogSourceType.Script } => await _akka.AskAsync(LoggingMessages.GetLogger.Instance.ToScript(long.Parse(_topic.Filter.SourceId)).WithReply<LogRouter>()),
            _ => await _akka.AskAsync(LoggingMessages.GetLogger.Instance.ToWorld().WithReply<LogRouter>()),
        };

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
        _akka.Tell(new EventBusMessages.Unsubscribe(_eventSubscription).ToEventBus());
        return base.DisposeAsync();
    }
}
