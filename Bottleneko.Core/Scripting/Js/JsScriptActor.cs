using Akka.Actor;
using Akka.Event;
using Bottleneko.Actors;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Scripting.Bindings;
using Bottleneko.Services;
using Bottleneko.Utils;
using Microsoft.ClearScript;
using Microsoft.ClearScript.JavaScript;
using Microsoft.ClearScript.V8;
using Microsoft.VisualStudio.Threading;
using System.Reflection;
using System.Runtime.Loader;

namespace Bottleneko.Scripting.Js;

class JsScriptActor(IServiceProvider services, AkkaService akka, INekoLogger logger, IActorRef owner, long id, string name, string source) : NekoActor(services)
{
    record ThreadStarted : SingletonMessage<ThreadStarted>;
    record ThreadStopped : SingletonMessage<ThreadStopped>;
    record ScriptError(Exception Exception);

    public long Id => id;
    public string Name { get; set; } = name;
    public INekoLogger Logger { get; } = logger;

    private readonly V8ScriptEngine _engine = new(
        V8ScriptEngineFlags.EnableDateTimeConversion |
        V8ScriptEngineFlags.MarshalAllInt64AsBigInt |
        V8ScriptEngineFlags.EnableTaskPromiseConversion |
        V8ScriptEngineFlags.EnableValueTaskPromiseConversion |
        V8ScriptEngineFlags.UseSynchronizationContexts);

    private Thread _thread = null!;
    private IActorRef _self = null!;
    private SingleThreadedSynchronizationContext? _synchronizationContext;
    private readonly SingleThreadedSynchronizationContext.Frame _frame = new();

    private void MainLoop(object? arg)
    {
        _self = (IActorRef)arg!;
        try
        {
            _synchronizationContext = new SingleThreadedSynchronizationContext();
            _self.Tell(ThreadStarted.Instance);
            SynchronizationContext.SetSynchronizationContext(_synchronizationContext);
            _synchronizationContext.PushFrame(_frame);
        }
        finally
        {
            _self.Tell(ThreadStopped.Instance);
        }
    }

    public override Task InitAsync(IActorRef self)
    {
        _thread = new Thread(MainLoop)
        {
            Name = $"Script Thread: {Name}",
        };
        _thread.Start(self);

        return Task.CompletedTask;
    }

    private void Invoke(Action func)
    {
        _synchronizationContext?.Post((_) => func(), null);
    }

    public void Subscribe(object token, string? @event, Func<string?, object, object> handler)
    {
        akka.Tell(new IEventBusMessage.SubscribeExternal(token, CallbackAsync, @event));

        Task CallbackAsync(string eventName, object arg)
        {
            if (arg.GetType().GetCustomAttribute<ExposeToScriptsAttribute>() is not null)
            {
                Invoke(() =>
                {
                    try
                    {
                        if (handler(eventName, arg) is Task task)
                        {
                            _ = task.ContinueWith(result =>
                            {
                                if (result.IsFaulted)
                                {
                                    OnScriptError(result.Exception);
                                }
                            }, TaskScheduler.Default);
                        }
                    }
                    catch (Exception e)
                    {
                        OnScriptError(e);
                    }
                });
            }

            return Task.CompletedTask;
        }
    }

    public async Task<ConnectionBinding?> GetConnectionAsync(long id)
    {
        return await akka.AskAsync<ConnectionBinding?>(new IConnectionsMessage.Get(id));
    }

    public void Unsubscribe(object token)
    {
        akka.Tell(new IEventBusMessage.Unsubscribe(token));
    }

    private void OnScriptError(Exception ex)
    {
        if (ex is AggregateException { InnerException: ScriptEngineException })
        {
            ex = ex.InnerException;
        }
        
        if (ex is ScriptEngineException { ErrorDetails: not null } scriptEngineException)
        {
            // Workaround for ClearScript leaking it's internal script initialization code in error messages
            var errorInfo = string.Join('\n', scriptEngineException.ErrorDetails.Split('\n').Select(line => line.Contains(" -> Object.defineProperty(this,'EngineInternal'") ? line.Split(" -> ")[0] : line));
            Logger.LogError("Bottleneko.Scripting", $"An error has occured in script:\n\n{errorInfo}");
        }
        else
        {
            Logger.LogError("Bottleneko.Scripting", "An error has occured in script", ex);
        }
    }

    public void Stop()
    {
        _engine.Interrupt();
        _frame.Continue = false;
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case ThreadStarted:
                var self = Self;
                Invoke(() =>
                {
                    _engine.Global.SetProperty("__Host", new HostFunctions());
                    _engine.Global.SetProperty("__Api", new JsApi(Services, this));
                    _engine.Global.SetProperty("__Core", new HostTypeCollection(type => type.GetCustomAttribute<ExposeToScriptsAttribute>() is not null, AssemblyLoadContext.Default.Assemblies.ToArray()));

                    _engine.DocumentSettings.AccessFlags = DocumentAccessFlags.EnableFileLoading | DocumentAccessFlags.AllowCategoryMismatch;
                    _engine.DocumentSettings.Loader = new JsLoader(source);

                    try
                    {
                        if (_engine.EvaluateDocument("@script") is Task task)
                        {
                            _ = task.ContinueWith(result =>
                            {
                                if (result.IsFaulted)
                                {
                                    self.Tell(new ScriptError(result.Exception));
                                    owner.Tell(new ScriptInstance.FatalScriptError(result.Exception));
                                    self.Tell(IControlMessage.Shutdown.Instance);
                                }
                            }, TaskScheduler.Default);
                        }
                    }
                    catch (Exception e)
                    {
                        self.Tell(new ScriptError(e));
                        owner.Tell(new ScriptInstance.FatalScriptError(e));
                        self.Tell(IControlMessage.Shutdown.Instance);
                    }
                });
                break;

            case ThreadStopped:
                Context.Stop(Self);
                break;

            case ScriptError scriptError:
                OnScriptError(scriptError.Exception);
                break;

            case IControlMessage.Shutdown:
                _engine.Interrupt();
                _frame.Continue = false;
                break;

            default:
                Unhandled(message);
                break;
        }
    }

    protected override void PostStop()
    {
        _engine.Interrupt();
        _frame.Continue = false;
        _thread.Join();
        _engine.Dispose();
    }
}
