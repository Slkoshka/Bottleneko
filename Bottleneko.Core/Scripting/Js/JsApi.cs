using Bottleneko.Logging;
using Bottleneko.Scripting.Bindings;
using Microsoft.ClearScript;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Js;

[SuppressMessage("Style", "VSTHRD200:Use \"Async\" suffix for async methods")]
public class JsApi
{
    public string ScriptName => _script.Name;

    private readonly JsScriptActor _script;
    private readonly HostFunctions _host = new();

    internal JsApi(JsScriptActor script)
    {
        _script = script;
    }

    public object Subscribe(string? @event, object handler)
    {
        var token = new object();
        _script.Subscribe(token, @event, (Func<string?, object, object>)_host.func(2, handler));
        return token;
    }

    [SuppressMessage("Performance", "CA1822:Mark members as static")]
    public Task Wait(int milliseconds)
    {
        return Task.Delay(milliseconds);
    }

    [SuppressMessage("Performance", "CA1822:Mark members as static")]
    public string GetTypeName<T>()
    {
        return typeof(T).Name;
    }

    [SuppressMessage("Performance", "CA1822:Mark members as static")]
    public bool IsEnum(object? value)
    {
        return value?.GetType().IsEnum ?? false;
    }

    public void Unsubscribe(object token)
    {
        _script.Unsubscribe(token);
    }

    public Task<ConnectionBinding?> GetConnection(BigInteger id)
    {
        return _script.GetConnectionAsync((long)id);
    }

    public void Stop()
    {
        _script.Stop();
    }

    public void Log(LogSeverity severity, string category, string message)
    {
        _script.Logger.Log(severity, category, message);
    }
}
