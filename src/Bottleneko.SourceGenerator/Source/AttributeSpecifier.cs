using Bottleneko.SourceGenerator.Source.Expressions;

namespace Bottleneko.SourceGenerator.Source;

class AttributeSpecifier(string type) : ITopLevelDeclaration
{
    public List<ICompileTimeExpression> Arguments { get; init; } = [];
    public Dictionary<string, ICompileTimeExpression> NamedArguments { get; init; } = [];

    private IEnumerable<string> RenderNamedArgument(KeyValuePair<string, ICompileTimeExpression> argument)
    {
        yield return argument.Key;
        yield return " = ";
        foreach (var part in argument.Value.Render())
        {
            yield return part;
        }
    }

    public IEnumerable<string> Render(Indentation indent)
    {
        yield return indent;
        yield return "[";
        yield return type;
        if (Arguments.Count > 0 || NamedArguments.Count > 0)
        {
            yield return "(";
            foreach (var part in Arguments.Select(argument => argument.Render()).Concat(NamedArguments.Select(RenderNamedArgument)).SeparatedBy(", "))
            {
                yield return part;
            }
            yield return ")";
        }
        yield return "]";
    }

    public static implicit operator AttributeSpecifier(string type) => new(type);
}
