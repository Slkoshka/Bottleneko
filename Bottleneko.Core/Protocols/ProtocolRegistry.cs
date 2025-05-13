using Bottleneko.Api.Dtos;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;

namespace Bottleneko.Protocols;

public record ProtocolDescription(Protocol Id, Type ConnectionType, Type ConfigType, Type BindingType);

public class ProtocolRegistry
{
    private readonly Dictionary<Protocol, ProtocolDescription> _protocols = [];

    public ProtocolRegistry()
    {
        foreach (var type in Assembly.GetExecutingAssembly().GetTypes().Where(t => t.IsDefined(typeof(ProtocolAttribute), false)))
        {
            var attr = type.GetCustomAttribute<ProtocolAttribute>();
            if (attr is null)
            {
                continue;
            }

            if (!type.IsSubclassOf(typeof(ConnectionBase)))
            {
                throw new NotSupportedException($"Type '{type.FullName}' must inherit from '{nameof(ConnectionBase)}'");
            }

            _protocols.Add(attr.Id, new ProtocolDescription(attr.Id, type, attr.Config, attr.Binding));
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

    public async Task<object?> TestAsync(ProtocolDescription protocol, object config, CancellationToken cancellationToken = default)
    {
        return await (Task<object?>)protocol.ConnectionType.GetMethod(nameof(TestAsync), BindingFlags.Public | BindingFlags.Static)!.Invoke(null, [config, cancellationToken])!;
    }
}
