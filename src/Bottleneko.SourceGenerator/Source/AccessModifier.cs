namespace Bottleneko.SourceGenerator.Source;

enum AccessModifierType
{
    Public,
    Private,
    Protected,
    Internal,
    ProtectedInternal,
    PrivateProtected,
}

class AccessModifier(AccessModifierType type)
{
    public string Render()
    {
        return type switch
        {
            AccessModifierType.Public => "public",
            AccessModifierType.Private => "private",
            AccessModifierType.Protected => "protected",
            AccessModifierType.Internal => "internal",
            AccessModifierType.ProtectedInternal => "protected internal",
            AccessModifierType.PrivateProtected => "private protected",
            _ => throw new Exception("Invalid value"),
        };
    }

    public static implicit operator AccessModifier(AccessModifierType type) => new(type);
}
