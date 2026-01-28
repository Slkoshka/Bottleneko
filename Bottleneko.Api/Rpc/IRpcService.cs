namespace Bottleneko.Api.Rpc;

public interface IRpcService
{
    Task<ResponsePacket> ExecuteAsync(RpcContext context, RequestPacket packet);
    bool IsMethodSupported(RequestPacket packet);
}
