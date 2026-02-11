using Bottleneko.SourceGenerator.Source.Statements;

namespace Bottleneko.SourceGenerator.Source;

enum MethodType
{
    None,
    Partial,
    Abstract,
    New,
    Virtual,
    NewVirtual,
    Override,
    Static,
}

class MethodDeclaration(string returnType, string name, ArgumentsDeclaration arguments) : IMemberDeclaration
{
    public AccessModifier? AccessModifier { get; init; }
    public MethodType Type { get; init; }
    public bool IsAsync { get; init; }
    public List<AttributeSpecifier> Attributes { get; init; } = [];
    public Body? Body { get; init; } = [];

    public IEnumerable<string> Render(Indentation indent)
    {
        foreach (var attribute in Attributes)
        {
            foreach (var part in attribute.Render(indent))
            {
                yield return part;
            }
            yield return "\n";
        }

        yield return indent;

        if (AccessModifier is not null)
        {
            yield return AccessModifier.Render();
            yield return " ";
        }

        if (this is { Body: null, Type: not MethodType.Abstract and not MethodType.Partial })
        {
            throw new Exception("Method must declare a body if it is not marked abstract or partial");
        }

        switch (Type)
        {
            case MethodType.Abstract:
                yield return "abstract ";
                break;

            case MethodType.New:
                yield return "new ";
                break;

            case MethodType.Virtual:
                yield return "virtual ";
                break;
            
            case MethodType.NewVirtual:
                yield return "new virtual ";
                break;

            case MethodType.Override:
                yield return "override ";
                break;
            
            case MethodType.Static:
                yield return "static ";
                break;
        }

        if (IsAsync)
        {
            if (Body is null)
            {
                throw new Exception("Async methods must have a body");
            }

            yield return "async ";
        }

        yield return returnType;
        yield return " ";
        yield return name;

        yield return "(";
        foreach (var part in arguments.Render())
        {
            yield return part;
        }
        yield return ")";

        if (Body is null)
        {
            yield return ";";
        }
        else
        {
            yield return "\n";
            foreach (var part in Body.Render(indent))
            {
                yield return part;
            }
        }
    }
}
