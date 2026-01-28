using Bottleneko.Api.Rpc;

namespace Bottleneko.Rpc;

public class RpcServiceCollection
{
    record ServiceDefinition(Func<RequestPacket, bool> IsRequestSupported, Func<RpcContext, RequestPacket, Task<ResponsePacket>> HandleRequest);

    private List<ServiceDefinition> _services = [];

    public void Register(IRpcService service)
    {
        _services.Add(new(service.IsMethodSupported, service.ExecuteAsync));
    }

    public async Task<ResponsePacket> HandleRequestAsync(RpcContext context, RequestPacket request)
    {
        try
        {
            return await (_services.FirstOrDefault(service => service.IsRequestSupported(request))?.HandleRequest(context, request) ?? Task.FromResult(new ResponsePacket(request.RequestId, new ErrorResult("Unknown service or method"))));
        }
        catch (Exception ex)
        {
            return new ResponsePacket(request.RequestId, new ErrorResult(ex.ToString()));
        }
    }

    public void HandleConnectionClosed(RpcContext context)
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
