namespace Bottleneko.Scripting;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Enum | AttributeTargets.Interface | AttributeTargets.Struct, AllowMultiple = false)]
public class ExposeToScriptsAttribute(params Type[] derivedTypes) : Attribute
{
    public Type[] DerivedTypes { get; } = derivedTypes;
}
