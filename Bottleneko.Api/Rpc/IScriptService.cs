namespace Bottleneko.Api.Rpc;

[RpcService(RpcService.Script)]
public partial interface IScriptService : IRpcService
{
    string GetId(RpcContext context);
    string GetName(RpcContext context);
}
