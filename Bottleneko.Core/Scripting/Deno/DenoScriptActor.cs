using System.Text.Json;
using System.Text.Json.Nodes;
using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Helpers;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Rpc;
using Bottleneko.Services;
using Bottleneko.Protocols;
using Bottleneko.Api.Rpc;
using Bottleneko.Rpc.Services;
using Bottleneko.Rpc.Services.Scripts;

namespace Bottleneko.Scripting.Deno;

class DenoScriptActor(IServiceProvider services, AkkaService akka, DenoScriptEngine engine, NekoEnvironment environment, INekoLogger logger, long id, string name, string source) : NekoActor(services)
{
    public record CreateMessagesSubscription(IActorRef Connection, ChatMessageFilter Filter, SubscriptionId SubscriptionId);
    record Start(RpcEndPoint EndPoint, string AccessToken);

    public INekoLogger Logger { get; } = logger;
    public long Id { get; } = id;
    public string Name { get; set; } = name;

    private readonly string _scriptDirectory = Path.Combine(environment.DataPath, "scripts", "env", $"script-{id}");

    private readonly RpcServiceCollection _services = new();
    private readonly DenoScriptEngine _engine = engine;
    private readonly string _source = source;

    private void RegisterRpcServices(IActorRef self)
    {
        _services.Register(new LoggingRpcService(self, Logger));
        _services.Register(new ScriptRpcService(this));
        _services.Register(new MessagesRpcService(self));
        _services.Register(new ConnectionsRpcService(Services, Logger, akka));
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
        RegisterRpcServices(self);
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
                Logger.LogDebug("Bottleneko.Script", "Installing dependencies");
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
                    Logger.LogDebug("Bottleneko.Script", "Running script");
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
                    Logger.LogError("Bottleneko.Script", $"deno install exited with code {processStopped.Code}");
                    Context.Stop(Self);
                }
                break;

            case ProcessMessages.ProcessFailed processFailed:
                Logger.LogError("Bottleneko.Script", "deno install failed", processFailed.Exception);
                Context.Stop(Self);
                break;

            case ProcessMessages.OutputLine outputLine:
                Logger.LogDebug("Bottleneko.Script", $"deno install: {outputLine.Line}");
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
            case RpcMessages.HandleRequest handleRequest:
                _ = _services.HandleRequestAsync(handleRequest.Context, handleRequest.Request).PipeTo(Sender, Self);
                break;

            case RpcMessages.ConnectionClosed connectionClosed:
                _services.HandleConnectionClosed(connectionClosed.Context);
                break;

            case CreateMessagesSubscription createMessagesSubscription:
                Sender.Tell(CreateChild<MessagesSubscriptionActor>([createMessagesSubscription.Connection, createMessagesSubscription.Filter, createMessagesSubscription.SubscriptionId, false]));
                break;

            case ProcessMessages.ProcessStopped processStopped:
                Logger.LogDebug("Bottleneko.Script", $"Script process finished");
                Context.Stop(Self);
                break;

            case ProcessMessages.ProcessFailed processFailed:
                Logger.LogError("Bottleneko.Script", "Script process failed", processFailed.Exception);
                Context.Stop(Self);
                break;

            case ProcessMessages.OutputLine outputLine:
                Logger.LogDebug("Bottleneko.Script", $"script: {outputLine.Line}");
                break;

            case ControlMessages.Shutdown:
                Context.Watch(process);
                process.Tell(ControlMessages.Shutdown.Instance);
                Become(msg => WaitForShutdown(process, msg));
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
