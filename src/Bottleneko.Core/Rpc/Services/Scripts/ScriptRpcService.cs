using Bottleneko.Api.Rpc;
using Bottleneko.Api.Rpc.Services;
using Bottleneko.Scripting.Deno;

namespace Bottleneko.Rpc.Services.Scripts;

class ScriptRpcService(DenoScriptActor script) : IScriptService
{
    public string GetId(IRpcContext _) => script.Id.ToString();
    public string GetName(IRpcContext _) => script.Name;
}
