using Bottleneko.Api.Rpc;
using Bottleneko.Scripting.Deno;

namespace Bottleneko.Scripting.Rpc;

class ScriptRpcService(DenoScriptActor script) : IScriptService
{
    public string GetId(RpcContext context) => script.Id.ToString();
    public string GetName(RpcContext context) => script.Name;
}
