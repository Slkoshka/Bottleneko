using System.Text.Json.Serialization;
using Bottleneko.Logging;

namespace Bottleneko.Api.Rpc;

[JsonDerivedType(typeof(LogLetter), typeDiscriminator: "Log")]
partial record Letter;
public record LogLetter(string Id, DateTime Timestamp, LogSeverity Severity, LogSourceType SourceType, string SourceId, string Category, string Text) : Letter;

public record LogFilter(LogSeverity[]? Severities, LogSourceType? SourceType, string? SourceId, string? Category);

[RpcService(RpcService.Logging)]
public partial interface ILoggingService : IRpcService
{
    void Log(RpcContext context, LogSeverity severity, string message);
    Task<SubscriptionId> SubscribeAsync(RpcContext context, LogFilter filter);
    void Unsubscribe(RpcContext context, SubscriptionId subscriptionId);
}
