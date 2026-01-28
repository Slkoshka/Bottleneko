using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Rpc;
using Bottleneko.Messages;
using Bottleneko.Services;

namespace Bottleneko.Logging;

public class LogSubscriptionActor(IServiceProvider services, AkkaService akka, IActorRef connection, LogFilter filter, SubscriptionId subscriptionId, bool includeHistory) : SubscriptionActor(services, connection, subscriptionId)
{
    private readonly LogMessageEvent[] _logEventBuffer = new LogMessageEvent[256];
    private LogRouter? _logger = null;
    private bool _isInitialSend = includeHistory;
    private string? _lastMessageId;

    public override async Task InitAsync(IActorRef self)
    {
        await akka.AskAsync(new EventBusMessages.Subscribe(Self, "internal/log/message").ToEventBus().WithReply<object>());

        await base.InitAsync(self);
    }

    protected override async IAsyncEnumerable<Letter[]> GetNewMessagesAsync()
    {
        _logger ??= filter switch
        {
            { SourceType: LogSourceType.Connection, SourceId: null } => await akka.AskAsync(LoggingMessages.GetLogger.Instance.ToConnections().WithReply<LogRouter>()),
            { SourceType: LogSourceType.Connection } => await akka.AskAsync(LoggingMessages.GetLogger.Instance.ToConnection(long.Parse(filter.SourceId)).WithReply<LogRouter>()),
            { SourceType: LogSourceType.Script, SourceId: null } => await akka.AskAsync(LoggingMessages.GetLogger.Instance.ToScripting().WithReply<LogRouter>()),
            { SourceType: LogSourceType.Script } => await akka.AskAsync(LoggingMessages.GetLogger.Instance.ToScript(long.Parse(filter.SourceId)).WithReply<LogRouter>()),
            _ => await akka.AskAsync(LoggingMessages.GetLogger.Instance.ToWorld().WithReply<LogRouter>()),
        };

        var historyfilter = new LogMessageHistoryFilter(filter);
        var count = _isInitialSend ? _logger.Buffer.GetLast(_logEventBuffer.AsMemory(), historyfilter) : _logger.Buffer.GetSince(_lastMessageId, _logEventBuffer.AsMemory(), historyfilter);
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

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case EventBusMessages.Event { Payload: LogMessageEvent }:
                HasNewMessages();
                break;

            default:
                base.OnMessage(message);
                break;
        }
    }
}
