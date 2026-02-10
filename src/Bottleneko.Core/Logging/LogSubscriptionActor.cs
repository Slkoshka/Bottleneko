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
    private string? _lastMessageId;

    public override async Task InitAsync(IActorRef self)
    {
        await base.InitAsync(self);

        await akka.AskAsync(new EventBusMessages.Subscribe(Self, "internal/log/message").ToEventBus().WithReply<object>());
    }
    
    private static LogLetter MakeLetter(LogMessageEvent logEvent)
    {
        return new LogLetter(logEvent.Id, logEvent.Timestamp, logEvent.Severity, logEvent.SourceType, logEvent.SourceId, logEvent.Category, (string.IsNullOrWhiteSpace(logEvent.Message), logEvent.Exception) switch
        {
            (true, not null) => logEvent.Exception.ToString(),
            (false, null) => logEvent.Message!,
            (false, not null) => $"{logEvent.Message}\n\n{logEvent.Exception}",
            _ => string.Empty,
        });
    }

    protected override async IAsyncEnumerable<Letter[]> InitialMessagesAsync()
    {
        _logger ??= filter switch
        {
            { SourceType: LogSourceType.Connection, SourceId: null } => await akka.AskAsync(LoggingMessages.GetLogger.Instance.ToConnections().WithReply<LogRouter>()),
            { SourceType: LogSourceType.Connection } => await akka.AskAsync(LoggingMessages.GetLogger.Instance.ToConnection(long.Parse(filter.SourceId)).WithReply<LogRouter>()),
            { SourceType: LogSourceType.Script, SourceId: null } => await akka.AskAsync(LoggingMessages.GetLogger.Instance.ToScripting().WithReply<LogRouter>()),
            { SourceType: LogSourceType.Script } => await akka.AskAsync(LoggingMessages.GetLogger.Instance.ToScript(long.Parse(filter.SourceId)).WithReply<LogRouter>()),
            _ => await akka.AskAsync(LoggingMessages.GetLogger.Instance.ToWorld().WithReply<LogRouter>()),
        };

        if (includeHistory)
        {
            var historyfilter = new LogMessageHistoryFilter(filter);
            var count = _logger.Buffer.GetLast(_logEventBuffer.AsMemory(), historyfilter);

            if (count > 0)
            {
                yield return _logEventBuffer.Skip(_logEventBuffer.Length - count).Select(MakeLetter).Cast<Letter>().Reverse().ToArray();
                _lastMessageId = _logEventBuffer[^1].Id;
            }

            yield return [];
        }
        else
        {
            if (_logger.Buffer.GetLast(_logEventBuffer.AsMemory(0, 1), new LogMessageHistoryFilter(new(null, null, null, null))) > 0)
            {
                _lastMessageId = _logEventBuffer[0].Id;
            }
        }
    }

    protected override async IAsyncEnumerable<Letter[]> GetNewMessagesAsync()
    {
        if (_logger is null)
        {
            yield break;
        }

        var historyfilter = new LogMessageHistoryFilter(filter);
        var count = _logger.Buffer.GetSince(_lastMessageId, _logEventBuffer.AsMemory(), historyfilter);
        if (count > 0)
        {
            var items = _logEventBuffer.Take(count);
            yield return items.Select(MakeLetter).Cast<Letter>().Reverse().ToArray();
            _lastMessageId = _logEventBuffer[count - 1].Id;
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
