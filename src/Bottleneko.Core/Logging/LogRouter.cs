using Bottleneko.Utils;

namespace Bottleneko.Logging;

public record struct LogMessageEvent(string Id, DateTime Timestamp, LogSeverity Severity, LogSourceType SourceType, string SourceId, string Category, string Message, Exception? Exception) : IHistoryItem;

public class LogRouter(LogSourceType defaultSourceType, string defaultSourceId, int bufferSize = 10_000) : INekoLogger
{
    public LogBuffer Buffer { get; } = new LogBuffer(bufferSize);
    public event EventHandler<LogMessageEvent>? OnMessage;

    public void Log(LogSourceType sourceType, string sourceId, LogSeverity severity, string category, string message, Exception? exception = null)
    {
        var @event = new LogMessageEvent(Guid.NewGuid().ToString(), DateTime.UtcNow, severity, sourceType, sourceId, category, message, exception);
        Buffer.Write(@event);
        OnMessage?.Invoke(this, @event);
    }

    public void Log(LogSeverity severity, string category, string message, Exception? exception = null)
    {
        Log(defaultSourceType, defaultSourceId, severity, category, message, exception);
    }
}
