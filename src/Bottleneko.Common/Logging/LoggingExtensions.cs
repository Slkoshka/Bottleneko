namespace Bottleneko.Logging;

public static class LoggingExtensions
{
    public static void LogCritical(this INekoLogger logger, string category, string message, Exception? exception = null) => logger.Log(LogSeverity.Critical, category, message, exception);
    public static void LogError(this INekoLogger logger, string category, string message, Exception? exception = null) => logger.Log(LogSeverity.Error, category, message, exception);
    public static void LogWarning(this INekoLogger logger, string category, string message, Exception? exception = null) => logger.Log(LogSeverity.Warning, category, message, exception);
    public static void LogInfo(this INekoLogger logger, string category, string message, Exception? exception = null) => logger.Log(LogSeverity.Info, category, message, exception);
    public static void LogVerbose(this INekoLogger logger, string category, string message, Exception? exception = null) => logger.Log(LogSeverity.Verbose, category, message, exception);
    public static void LogDebug(this INekoLogger logger, string category, string message, Exception? exception = null) => logger.Log(LogSeverity.Debug, category, message, exception);
}
