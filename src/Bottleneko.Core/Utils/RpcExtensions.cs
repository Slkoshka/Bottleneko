using System.Data;
using Bottleneko.Actors;
using Bottleneko.Api.Rpc;
using Bottleneko.Rpc;

namespace Bottleneko.Utils;

public static class RpcExtensions
{
    extension(Exception exception)
    {
        public ErrorResult ToRpcError()
        {
            return exception switch
            {
                RpcException rpcException => new ErrorResult(rpcException.Code, rpcException.Message),
                DuplicateNameException => new ErrorResult(ErrorCode.DuplicateName, exception.Message),
                KeyNotFoundException or RouteNotFoundException => new ErrorResult(ErrorCode.NotFound, exception.Message),
                _ => new ErrorResult(ErrorCode.InternalError, exception.Message),
            };
        }
    }
}
