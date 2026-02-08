namespace Bottleneko.Api.Rpc;

[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public class RpcMethodAttribute : Attribute
{
    public Type? Context { get; init; } = null;
    public bool AllowAnonymous { get; init; } = false;
}

public interface IRpcService
{
    Task<ResponsePacket> ExecuteAsync(IRpcContext context, RequestPacket packet);
    bool IsMethodSupported(RequestPacket packet);
}
