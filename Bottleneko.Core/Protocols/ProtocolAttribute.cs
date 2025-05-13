using Bottleneko.Api.Dtos;

namespace Bottleneko.Protocols;

[AttributeUsage(AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
public class ProtocolAttribute(Protocol id, Type config, Type binding) : Attribute
{
    public Protocol Id => id;
    public Type Config => config;
    public Type Binding => binding;
}
