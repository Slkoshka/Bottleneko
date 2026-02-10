using Bottleneko.Logging;
using Microsoft.Extensions.Logging;

namespace Bottleneko.Protocols.Twitch;

class TwitchLogAdapter<T>(INekoLogger inner) : ILogger<T>
{
    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
    {
        inner.Log(logLevel switch
        {
            LogLevel.Critical => LogSeverity.Critical,
            LogLevel.Error => LogSeverity.Error,
            LogLevel.Warning => LogSeverity.Warning,
            LogLevel.Information => LogSeverity.Verbose,
            LogLevel.Debug => LogSeverity.Verbose,
            LogLevel.Trace => LogSeverity.Debug,
            _ => LogSeverity.Debug,
        }, typeof(T).Name, formatter(state, exception), exception);
    }

    public bool IsEnabled(LogLevel logLevel) => true;
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
}
