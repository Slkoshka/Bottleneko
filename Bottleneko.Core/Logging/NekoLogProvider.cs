using Microsoft.Extensions.Logging;

namespace Bottleneko.Logging;

public class NekoLogProvider(INekoLogger? nekoLogger = null) : ILoggerProvider, INekoLogger
{
    public INekoLogger? Logger { get; set; } = nekoLogger;
    
    public ILogger CreateLogger(string categoryName)
    {
        return new NekoLogAdapter(this, categoryName);
    }
    
    public void Dispose()
    {
        GC.SuppressFinalize(this);
    }

    public void Log(LogSourceType sourceType, string sourceId, LogSeverity severity, string category, string message, Exception? exception = null)
    {
        Logger?.Log(sourceType, sourceId, severity, category, message, exception);
    }

    public void Log(LogSeverity severity, string category, string message, Exception? exception = null)
    {
        Logger?.Log(severity, category, message, exception);
    }
}
