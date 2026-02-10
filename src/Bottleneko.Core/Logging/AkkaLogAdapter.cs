using Akka.Actor;
using Akka.Event;

namespace Bottleneko.Logging;

public class AkkaLogAdapter : UntypedActor, ILoggerMessageQueueSemantics
{
    public static INekoLogger? GlobalLogger { get; set; }

    protected override void OnReceive(object message)
    {
        switch (message)
        {
            case LogMessageEvent messageEvent:
                GlobalLogger?.Log(messageEvent.SourceType, messageEvent.SourceId, messageEvent.Severity, messageEvent.Category, messageEvent.Message, messageEvent.Exception);
                break;

            case LogEvent logEvent:
                GlobalLogger?.Log(LogSourceType.System, logEvent.LogClass?.FullName ?? "System", logEvent.LogLevel() switch
                {
                    LogLevel.ErrorLevel => LogSeverity.Error,
                    LogLevel.WarningLevel => LogSeverity.Warning,
                    LogLevel.InfoLevel => LogSeverity.Verbose,
                    _ => LogSeverity.Debug,
                }, logEvent.LogSource, logEvent.Message?.ToString() ?? "", logEvent.Cause);
                break;

            case InitializeLogger:
                Sender.Tell(new LoggerInitialized());
                break;

            default:
                Unhandled(message);
                break;
        }
    }
}
