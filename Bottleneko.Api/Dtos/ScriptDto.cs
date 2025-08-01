using Bottleneko.Api.Graph;
using System.Text.Json.Serialization;

namespace Bottleneko.Api.Dtos;

public enum ScriptStatus
{
    Stopped,
    Starting,
    Running,
    Restarting,
    Stopping,

    Error,
}

[JsonDerivedType(typeof(JsScriptCode), "JavaScript")]
[JsonDerivedType(typeof(GraphScriptCode), "Graph")]
[SerializeAsJson]
public abstract record ScriptCode();

public record JsScriptCode(string Source) : ScriptCode;

public record ScriptDto(string Id, string Name, string Description, bool AutoStart, ScriptCode Code, ScriptStatus Status);
