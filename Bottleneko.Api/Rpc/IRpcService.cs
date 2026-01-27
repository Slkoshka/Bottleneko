namespace Bottleneko.Api.Rpc;

public interface IRpcService
{
    Task<ResponsePacket> ExecuteAsync(RequestPacket packet);
    bool IsMethodSupported(RequestPacket packet);
}
