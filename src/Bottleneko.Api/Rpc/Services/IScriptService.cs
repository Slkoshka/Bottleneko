namespace Bottleneko.Api.Rpc.Services;

[RpcService(RpcService.Script)]
public partial interface IScriptService : IRpcService
{
    string GetId(IRpcContext context);
    string GetName(IRpcContext context);
}
