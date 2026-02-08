using System.Text.Json.Serialization;

namespace Bottleneko.Api.Rpc;

public enum ErrorCode
{
    // Client errors
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    DuplicateName = 1000,
    InvalidValue = 1001,
    SetupRequired = 1002,
    Unsupported = 1003,
    InvalidOperation = 1004,

    // Server errors
    InternalError = 500,
    Timeout = 2000,
    ConnectionError = 2001,
}

[JsonDerivedType(typeof(AuthenticatePacket), typeDiscriminator: "Authenticate")]
[JsonDerivedType(typeof(MailPacket), typeDiscriminator: "Mail")]
[JsonDerivedType(typeof(RequestPacket), typeDiscriminator: "Request")]
[JsonDerivedType(typeof(ResponsePacket), typeDiscriminator: "Response")]
public abstract record Packet();

public enum ClientType
{
    Api,
    Script,
}

public record AuthenticatePacket(ClientType ClientType, string AccessToken) : Packet;

public abstract partial record RpcRequest;
public abstract partial record RpcResponse;

public record RequestPacket(string RequestId, RpcRequest Request) : Packet;
public record ResponsePacket(string RequestId, ResponseResult Result) : Packet;

[JsonDerivedType(typeof(SuccessResult), "Success")]
[JsonDerivedType(typeof(ErrorResult), "Error")]
public abstract record ResponseResult;
public record SuccessResult(RpcResponse Data) : ResponseResult;
public record ErrorResult(ErrorCode Code, string Message, object? Extra = null) : ResponseResult;

public record SubscriptionId(string Id);
public abstract partial record Letter();
public record MailPacket(SubscriptionId SubscriptionId, Letter[] Letters) : Packet;

