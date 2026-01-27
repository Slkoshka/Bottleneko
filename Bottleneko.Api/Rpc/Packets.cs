using System.Text.Json.Serialization;
using Bottleneko.Api.Packets;

namespace Bottleneko.Api.Rpc;

public abstract partial record RpcRequest;
public abstract partial record RpcResponse;

public record RequestPacket(string RequestId, RpcRequest Request) : Packet;
public record ResponsePacket(string RequestId, ResponseResult Result) : Packet;

[JsonDerivedType(typeof(SuccessResult), "Success")]
[JsonDerivedType(typeof(ErrorResult), "Error")]
public abstract record ResponseResult;
public record SuccessResult(RpcResponse Data) : ResponseResult;
public record ErrorResult(string Message) : ResponseResult;
