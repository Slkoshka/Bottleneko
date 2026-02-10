using Akka.Actor;
using Akka.Configuration;
using Akka.DependencyInjection;
using Bottleneko.Actors;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Bottleneko.Services;

public class AkkaService(IServiceProvider services, IHostApplicationLifetime lifetime, NekoEnvironment environment) : IHostedService
{
    private ActorSystem? _system = null;
    private IActorRef? _world = null;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        AkkaLogAdapter.GlobalLogger = services.GetService<INekoLogger>();
        var bootstrap = BootstrapSetup.Create()
            .WithConfig(ConfigurationFactory.ParseString($@"
                akka {{
                    loggers = [""{typeof(AkkaLogAdapter).AssemblyQualifiedName}""]
                    loglevel = DEBUG
                    log-config-on-start = off
                    actor {{
                        serialize-messages = off
                        debug {{
                            receive = off
                            autoreceive = off
                            lifecycle = off
                            event-stream = off
                            unhandled = on
                        }}
                    }}
                }}
            "));
        var di = DependencyResolverSetup.Create(services);
        var setup = bootstrap.And(di);

        _system = ActorSystem.Create("neko", setup);
        var dr = DependencyResolver.For(_system);

        _world = _system.ActorOf(dr.Props<NekoWorld>([environment.ApiActorType]), "world");
        _ = _system.WhenTerminated.ContinueWith(_ => lifetime.StopApplication(), CancellationToken.None, TaskContinuationOptions.None, TaskScheduler.Default);

        await _world.Ask(ControlMessages.Ready.Instance, cancellationToken);
    }

    public void Tell(Route.RoutedMessage routed)
    {
        _world!.Tell(routed.Build());
    }

    public async Task<T> AskAsync<T>(Route.RoutedMessageWithReply<T> routed)
    {
        var result = await _world!.Ask<object>(routed.Build());
        if (result is Status.Failure failure)
        {
            throw failure.Cause;
        }
        else
        {
            return (T)result;
        }
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_system is null)
        {
            return;
        }
        _world.Tell(ControlMessages.Shutdown.Instance);
        await _world.WatchAsync(cancellationToken);
        await CoordinatedShutdown.Get(_system).Run(CoordinatedShutdown.ClrExitReason.Instance);
        _system = null;
    }
}
