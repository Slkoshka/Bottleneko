using Bottleneko.Api.Rpc;
using Bottleneko.Utils;

namespace Bottleneko.Rpc;

public class RpcServiceCollection
{
    record ServiceDefinition(Func<RequestPacket, bool> IsRequestSupported, Func<IRpcContext, RequestPacket, Task<ResponsePacket>> HandleRequest);

    private readonly List<ServiceDefinition> _services = [];

    public void Register(IRpcService service)
    {
        _services.Add(new(service.IsMethodSupported, service.ExecuteAsync));
    }

    public async Task<ResponsePacket> HandleRequestAsync(IRpcContext context, RequestPacket request)
    {
        try
        {
            return await (_services.FirstOrDefault(service => service.IsRequestSupported(request))?.HandleRequest(context, request) ?? Task.FromResult(new ResponsePacket(request.RequestId, new ErrorResult(ErrorCode.Unsupported, "Unknown service or method"))));
        }
        catch (Exception ex)
        {
            return new ResponsePacket(request.RequestId, ex.ToRpcError());
        }
    }

    public void HandleConnectionClosed(IRpcContext context)
    {
        foreach (var service in _services)
        {
            if (service is IConnectionClosedListener connectionClosedListener)
            {
                connectionClosedListener.OnConnectionClosed(context);
            }
        }
    }
}
