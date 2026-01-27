using Bottleneko.Api.Rpc;

namespace Bottleneko.Rpc;

public class RpcServiceCollection
{
    record ServiceDefinition(Func<RequestPacket, bool> IsRequestSupported, Func<RequestPacket, Task<ResponsePacket>> HandleRequest);

    private List<ServiceDefinition> _services = [];

    public void Register(IRpcService service)
    {
        _services.Add(new(service.IsMethodSupported, service.ExecuteAsync));
    }

    public async Task<ResponsePacket> HandleRequestAsync(RequestPacket request)
    {
        return await (_services.FirstOrDefault(service => service.IsRequestSupported(request))?.HandleRequest(request) ?? Task.FromResult(new ResponsePacket(request.RequestId, new ErrorResult("Unknown service or method"))));
    }
}
