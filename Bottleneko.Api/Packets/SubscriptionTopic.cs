using Bottleneko.Logging;
using System.Text.Json.Serialization;

namespace Bottleneko.Api.Packets;

public record LogFilter(LogSeverity[]? Severities, LogSourceType? SourceType, string? SourceId, string? Category);
public record LogsSubscriptionTopic(LogFilter Filter) : SubscriptionTopic;

public record ChatMessageFilter(string? ConnectionId);
public record ChatMessagesSubscriptionTopic(ChatMessageFilter Filter) : SubscriptionTopic;

[JsonDerivedType(typeof(LogsSubscriptionTopic), typeDiscriminator: "Logs")]
[JsonDerivedType(typeof(ChatMessagesSubscriptionTopic), typeDiscriminator: "ChatMessages")]
public abstract record SubscriptionTopic();
