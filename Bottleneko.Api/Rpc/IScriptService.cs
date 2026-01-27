namespace Bottleneko.Api.Rpc;

[RpcService(RpcService.Script)]
public partial interface IScriptService : IRpcService
{
    public string GetId();
    public string GetName();
}
