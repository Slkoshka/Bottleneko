using Bottleneko.Api.Dtos;
using Bottleneko.Logging;
using System.Text.Json.Serialization;

namespace Bottleneko.Api.Packets;

public record LogLetter(string Id, DateTime Timestamp, LogSeverity Severity, LogSourceType SourceType, string SourceId, string Category, string Text) : Letter;

public record ChatMessageLetter(ChatMessageDto Content) : Letter;

[JsonDerivedType(typeof(LogLetter), typeDiscriminator: "Log")]
[JsonDerivedType(typeof(ChatMessageLetter), typeDiscriminator: "ChatMessage")]
public abstract record Letter();

public record MailPacket(string SubscriptionId, Letter[] Letters) : Packet;
