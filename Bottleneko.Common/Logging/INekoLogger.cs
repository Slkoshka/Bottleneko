using Bottleneko.Scripting;

namespace Bottleneko.Logging;

public enum LogSourceType
{
    System,
    Connection,
    Script,
}

[ExposeToScripts]
public enum LogSeverity
{
    Critical,
    Error,
    Warning,
    Info,
    Verbose,
    Debug,
}

public interface INekoLogger
{
    void Log(LogSourceType sourceType, string sourceId, LogSeverity severity, string category, string message, Exception? exception = null);
    void Log(LogSeverity severity, string category, string message, Exception? exception = null);
}
