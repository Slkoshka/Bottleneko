namespace Bottleneko.Api.Rpc;

[AttributeUsage(AttributeTargets.Interface, AllowMultiple = false)]
public class RpcServiceAttribute(RpcService service) : Attribute
{
    public RpcService Service { get; } = service;
}
