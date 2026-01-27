using Bottleneko.Api.Rpc;
using Bottleneko.Scripting.Deno;

namespace Bottleneko.Rpc.Api;

class ScriptRpcService(DenoScriptActor script) : IScriptService
{
    public string GetId() => script.Id.ToString();
    public string GetName() => script.Name;
}
