using System.Text.Json.Serialization;
using Bottleneko.Logging;

namespace Bottleneko.Api.Rpc
{
    [JsonDerivedType(typeof(LogLetter), typeDiscriminator: "Log")]
    partial record Letter;
    public record LogLetter(string Id, DateTime Timestamp, LogSeverity Severity, LogSourceType SourceType, string SourceId, string Category, string Text) : Letter;

    public record LogFilter(LogSeverity[]? Severities, LogSourceType? SourceType, string? SourceId, string? Category);
}

namespace Bottleneko.Api.Rpc.Services
{
    [RpcService(RpcService.Logging)]
    public partial interface ILoggingService : IRpcService
    {
        void Log(IRpcContext context, LogSeverity severity, string message);
        Task<SubscriptionId> SubscribeAsync(IRpcContext context, LogFilter filter);
        void Unsubscribe(IRpcContext context, SubscriptionId subscriptionId);
    }
}
