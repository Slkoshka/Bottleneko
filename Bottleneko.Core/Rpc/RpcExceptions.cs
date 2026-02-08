using Bottleneko.Api.Rpc;

namespace Bottleneko.Rpc;

public class RpcException(ErrorCode code, string message) : Exception(message)
{
    public ErrorCode Code => code;
}

public class RpcAuthenticationRequiredException() : RpcException(ErrorCode.Unauthorized, "Unauthorized")
{
}

public class RpcForbiddenException() : RpcException(ErrorCode.Forbidden, "Forbidden")
{
}

public class RpcUnsupportedException() : RpcException(ErrorCode.Unsupported, "Unsupported")
{
}
