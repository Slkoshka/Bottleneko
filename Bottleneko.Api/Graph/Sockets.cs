using System.Text.Json.Serialization;

namespace Bottleneko.Api.Graph;

public record GraphInvalidSocketType() : GraphSocketType;
public record GraphExecSocketType() : GraphSocketType;
public record GraphBooleanSocketType() : GraphSocketType;
public record GraphNumberSocketType() : GraphSocketType;
public record GraphStringSocketType() : GraphSocketType;
public record GraphIdSocketType() : GraphSocketType;
public record GraphProtocolSocketType() : GraphSocketType;
public record GraphTimestampSocketType() : GraphSocketType;
public record GraphChatSocketType() : GraphSocketType;
public record GraphChatMessageSocketType() : GraphSocketType;
public record GraphChatterSocketType() : GraphSocketType;
public record GraphAnyStructureInputSocketType() : GraphSocketType;
public record GraphAnyEnumInputSocketType() : GraphSocketType;
public record GraphAnyOptionalInputSocketType() : GraphSocketType;
public record GraphOptionalSocketType(GraphSocketType InnerType) : GraphSocketType;


[JsonDerivedType(typeof(GraphInvalidSocketType), "invalid")]
[JsonDerivedType(typeof(GraphExecSocketType), "exec")]
[JsonDerivedType(typeof(GraphBooleanSocketType), "boolean")]
[JsonDerivedType(typeof(GraphNumberSocketType), "number")]
[JsonDerivedType(typeof(GraphStringSocketType), "string")]
[JsonDerivedType(typeof(GraphIdSocketType), "id")]
[JsonDerivedType(typeof(GraphProtocolSocketType), "protocol")]
[JsonDerivedType(typeof(GraphTimestampSocketType), "timestamp")]
[JsonDerivedType(typeof(GraphChatSocketType), "chat")]
[JsonDerivedType(typeof(GraphChatMessageSocketType), "chat-message")]
[JsonDerivedType(typeof(GraphChatterSocketType), "chatter")]
[JsonDerivedType(typeof(GraphAnyStructureInputSocketType), "any-structure")]
[JsonDerivedType(typeof(GraphAnyEnumInputSocketType), "any-enum")]
[JsonDerivedType(typeof(GraphAnyOptionalInputSocketType), "any-optional")]
[JsonDerivedType(typeof(GraphOptionalSocketType), "optional")]
public abstract record GraphSocketType();
