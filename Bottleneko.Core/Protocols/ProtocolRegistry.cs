using Akka.Actor;
using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Connections;
using Bottleneko.Logging;
using Bottleneko.Scripting.Bindings;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;

namespace Bottleneko.Protocols;

public delegate ConnectionBase ConnectionFactory<TConfig>(IServiceProvider services, INekoLogger logger, ConnectionCreationData<TConfig> data) where TConfig : ProtocolConfiguration;
public delegate RawConnectionBinding ConnectionBindingFactory(long connectionId, IActorRef connection);
public delegate Task<object?> ConnectionTest<TConfig>(IServiceProvider services, TConfig config, CancellationToken cancellationToken) where TConfig: ProtocolConfiguration;
public class ProtocolDescription
{
    public Protocol Id { get; }
    public ConnectionFactory<ProtocolConfiguration> Factory { get; }
    public ConnectionTest<ProtocolConfiguration> Test { get; }
    public Type ConfigType { get; }
    public ConnectionBindingFactory BindingFactory { get; }

    private ProtocolDescription(Protocol id, ConnectionFactory<ProtocolConfiguration> factory, ConnectionTest<ProtocolConfiguration> test, Type configType, ConnectionBindingFactory bindingFactory)
    {
        Id = id;
        Factory = factory;
        Test = test;
        ConfigType = configType;
        BindingFactory = bindingFactory;
    }

    public static ProtocolDescription Make<TConfig>(Protocol id, ConnectionFactory<TConfig> factory, ConnectionTest<TConfig> test, ConnectionBindingFactory bindingFactory) where TConfig: ProtocolConfiguration
    {
        return new(
            id,
            (services, logger, data) => factory(services, logger, data.To<TConfig>()),
            (services, config, cancellationToken) => test(services, (TConfig)config, cancellationToken),
            typeof(TConfig),
            bindingFactory
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
