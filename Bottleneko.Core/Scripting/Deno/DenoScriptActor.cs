using System.Text.Json;
using System.Text.Json.Nodes;
using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Helpers;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Rpc.Api;
using Bottleneko.Rpc;
using Bottleneko.Services;
using Bottleneko.Api.Rpc;

namespace Bottleneko.Scripting.Deno;

class DenoScriptActor(IServiceProvider services, AkkaService akka, DenoScriptEngine engine, NekoEnvironment environment, INekoLogger logger, long id, string name, string source) : NekoActor(services)
{
    record Start(RpcEndPoint EndPoint, string AccessToken);

    public long Id { get; } = id;
    public string Name { get; set; } = name;

    private readonly string _scriptDirectory = Path.Combine(environment.DataPath, "scripts", "env", $"script-{id}");

    private readonly RpcServiceCollection _services = new();
    private readonly DenoScriptEngine _engine = engine;
    private readonly string _source = source;

    private void RegisterRpcServices()
    {
        _services.Register(new ScriptRpcService(this));
    }

    private async Task DeployAsync()
    {
        FileSystem.Delete(_scriptDirectory, recursive: true);
        Directory.CreateDirectory(_scriptDirectory);

        await File.WriteAllTextAsync(Path.Combine(_scriptDirectory, "entrypoint.ts"), "import runtime from 'neko/runtime'; import './index.ts';");

        var (denoJsonContents, denoJsonFileName) = (File.Exists(Path.Combine(_scriptDirectory, "deno.json")), File.Exists(Path.Combine(_scriptDirectory, "deno.jsonc"))) switch
        {
            (true, true) => throw new Exception("Both deno.json and deno.jsonc cannot exist"),
            (false, false) => ("{}", null),
            (true, false) => (await File.ReadAllTextAsync(Path.Combine(_scriptDirectory, "deno.json")), "deno.json"),
            (false, true) => (await File.ReadAllTextAsync(Path.Combine(_scriptDirectory, "deno.jsonc")), "deno.jsonc"),
        };

        if (denoJsonFileName is not null)
        {
            File.Delete(Path.Combine(_scriptDirectory, denoJsonFileName));
        }

        var denoJson = (JsonNode.Parse(denoJsonContents, documentOptions: new JsonDocumentOptions()
        {
            AllowTrailingCommas = true,
            CommentHandling = JsonCommentHandling.Skip,
        })?.AsObject()) ?? throw new Exception($"Invalid {denoJsonFileName}");

        denoJson["links"] = new JsonArray("../../packages/neko");

        await File.WriteAllTextAsync(Path.Combine(_scriptDirectory, "deno.json"), denoJson.ToJsonString());
        await File.WriteAllTextAsync(Path.Combine(_scriptDirectory, "index.ts"), _source);
    }

    public override async Task InitAsync(IActorRef self)
    {
        RegisterRpcServices();
        await DeployAsync();

        var accessToken = await akka.AskAsync(new ScriptingMessages.GetAccessToken(Id).ToScripting().WithReply<string?>()) ?? throw new Exception("Failed to get script access token");
        var endPoint = await akka.AskAsync(new RpcMessages.GetEndPoint().ToRpc().WithReply<RpcEndPoint>());

        self.Tell(new Start(endPoint, accessToken));
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case Start start:
                logger.LogDebug("Bottleneko.Deno", "Installing dependencies");
                var installProcess = CreateChild<ProcessActor>([Self, DenoScriptEngine.DenoExecutable.Value, _scriptDirectory, new string[] { "install" }, new Dictionary<string, string>()
                {
                    { "DENO_DIR", _engine.DenoDir },
                    { "NO_COLOR", "1" },
                }]);

                Stash.UnstashAll();
                Become(msg => InstallingPackages(start.EndPoint, start.AccessToken, installProcess, msg));
                break;

            default:
                Stash.Stash();
                break;
        }
    }

    private void InstallingPackages(RpcEndPoint endPoint, string accessToken, IActorRef installProcess, object message)
    {
        switch (message)
        {
            case ProcessMessages.ProcessStopped processStopped:
                if (processStopped.Code == 0)
                {
                    logger.LogDebug("Bottleneko.Deno", "Running script");
                    var scriptProcess = CreateChild<ProcessActor>([Self, DenoScriptEngine.DenoExecutable.Value, _scriptDirectory, new string[] { "run", "--allow-all", "--no-prompt", "./entrypoint.ts", endPoint.Transport, endPoint.Name, accessToken }, new Dictionary<string, string>()
                    {
                        { "DENO_DIR", _engine.DenoDir },
                        { "NO_COLOR", "1" },
                    }]);

                    Stash.UnstashAll();
                    Become(msg => Running(scriptProcess, msg));
                }
                else
                {
                    logger.LogError("Bottleneko.Deno", $"deno install exited with code {processStopped.Code}");
                    Context.Stop(Self);
                }
                break;

            case ProcessMessages.ProcessFailed processFailed:
                logger.LogError("Bottleneko.Deno", "deno install failed", processFailed.Exception);
                Context.Stop(Self);
                break;

            case ProcessMessages.OutputLine outputLine:
                logger.LogDebug("Bottleneko.Deno", $"deno install: {outputLine.Line}");
                break;

            case ControlMessages.Shutdown:
                Stash.UnstashAll();
                Context.Watch(installProcess);
                installProcess.Tell(ControlMessages.Shutdown.Instance);
                Become(msg => WaitForShutdown(installProcess, msg));
                break;

            default:
                Stash.Stash();
                break;
        }
    }

    private void Running(IActorRef process, object message)
    {
        switch (message)
        {
            case ProcessMessages.ProcessStopped processStopped:
                logger.LogDebug("Bottleneko.Deno", $"Script process finished");
                Context.Stop(Self);
                break;

            case ProcessMessages.ProcessFailed processFailed:
                logger.LogError("Bottleneko.Deno", "Script process failed", processFailed.Exception);
                Context.Stop(Self);
                break;

            case ProcessMessages.OutputLine outputLine:
                logger.LogDebug("Bottleneko.Deno", $"script: {outputLine.Line}");
                break;

            case ControlMessages.Shutdown:
                Context.Watch(process);
                process.Tell(ControlMessages.Shutdown.Instance);
                Become(msg => WaitForShutdown(process, msg));
                break;

            case RequestPacket request:
                _ = _services.HandleRequestAsync(request).PipeTo(Sender, Self);
                break;

            default:
                Unhandled(message);
                break;
        }
    }

    private void WaitForShutdown(IActorRef process, object msg)
    {
        switch (msg)
        {
            case Terminated t:
                if (t.ActorRef == process)
                {
                    Context.Stop(Self);
                }
                break;

            default:
                Unhandled(msg);
                break;
        }
    }
}
