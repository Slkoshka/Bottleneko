using Akka.Actor;
using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Connections;
using Bottleneko.Logging;
using Bottleneko.Scripting.Bindings;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;

namespace Bottleneko.Protocols;

public delegate ConnectionBase DynamicConnectionFactory(ConnectionCreationData data, ProtocolContext context, ProtocolConfiguration config);
public delegate ConnectionBase StaticConnectionFactory<TConfig>(StaticConnectionCreationData<TConfig> context) where TConfig : ProtocolConfiguration;

public delegate Task<object?> DynamicConnectionTest(ProtocolContext context, ProtocolConfiguration config, CancellationToken cancellationToken);
public delegate Task<object?> StaticConnectionTest<TConfig>(StaticProtocolContext<TConfig> context, CancellationToken cancellationToken) where TConfig : ProtocolConfiguration;

public delegate RawConnectionBinding ConnectionBindingFactory(long connectionId, IActorRef connection);

public record ProtocolContext(IServiceProvider Services, INekoLogger Logger)
{
    public StaticProtocolContext<TConfig> Configure<TConfig>(ProtocolConfiguration config) where TConfig : ProtocolConfiguration => new(Services, Logger, (TConfig)config);
}

public record StaticProtocolContext<TConfig>(IServiceProvider Services, INekoLogger Logger, TConfig Configuration) : ProtocolContext(Services, Logger) where TConfig : ProtocolConfiguration;

public record ProtocolDescription(Protocol Id, DynamicConnectionFactory Factory, DynamicConnectionTest Test, ConnectionBindingFactory BindingFactory, Type ConfigType)
{
    public static ProtocolDescription Make<TConfig>(Protocol id, StaticConnectionFactory<TConfig> factory, StaticConnectionTest<TConfig> test, ConnectionBindingFactory bindingFactory) where TConfig : ProtocolConfiguration
    {
        return new(
            id,
            (data, context, config) => factory(data.Configure<TConfig>(context, config)),
            (context, config, cancellationToken) => test(context.Configure<TConfig>(config), cancellationToken),
            bindingFactory,
            typeof(TConfig)
        );
    }
}

public class ProtocolRegistry
{
    private readonly IServiceProvider _services;
    private readonly Dictionary<Protocol, ProtocolDescription> _protocols = [];

    public ProtocolRegistry(IServiceProvider services)
    {
        _services = services;

        foreach (var type in Assembly.GetExecutingAssembly().GetTypes().Where(t => !t.IsAbstract && t.IsSubclassOf(typeof(ConnectionBase)) && t.IsAssignableTo(typeof(IProtocol))))
        {
            var desc = (ProtocolDescription)type.GetMethod(nameof(IProtocol.GetDescription), BindingFlags.Public | BindingFlags.Static)?.Invoke(null, [])!;
            _protocols.Add(desc.Id, desc);
        }
    }

    public ProtocolDescription GetProtocol(Protocol id)
    {
        return _protocols[id];
    }

    public bool TryGetProtocol(Protocol id, [MaybeNullWhen(false)] out ProtocolDescription protocol)
    {
        return _protocols.TryGetValue(id, out protocol);
    }
}
