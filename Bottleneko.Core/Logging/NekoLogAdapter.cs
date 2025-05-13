using Microsoft.Extensions.Logging;

namespace Bottleneko.Logging;

public class NekoLogAdapter(INekoLogger inner, string category) : ILogger
{
    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
    {
        inner.Log(logLevel switch
        {
            LogLevel.Critical => LogSeverity.Critical,
            LogLevel.Error => LogSeverity.Error,
            LogLevel.Warning => LogSeverity.Warning,
            LogLevel.Information => LogSeverity.Info,
            LogLevel.Debug => LogSeverity.Verbose,
            LogLevel.Trace => LogSeverity.Debug,
            _ => LogSeverity.Debug,
        }, category, formatter(state, exception), exception);
    }

    public bool IsEnabled(LogLevel logLevel) => true;
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
}
