namespace Bottleneko.SourceGenerator.Source.Types;

abstract class StructuredTypeDeclaration : ITypeDeclaration
{
    public AccessModifier? AccessModifier { get; init; }
    public bool IsPartial { get; init; } = false;

    public List<AttributeSpecifier> Attributes { get; init; } = [];
    public List<IMemberDeclaration> Members { get; init; } = [];
    public List<string> BaseTypes { get; init; } = [];

    protected abstract IEnumerable<string> RenderType();

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

        foreach (var part in RenderType())
        {
            yield return part;
        }

        if (BaseTypes.Count() > 0)
        {
            yield return " : ";
            foreach (var part in BaseTypes.Select<string, IEnumerable<string>>(baseType => [baseType]).SeparatedBy(", "))
            {
                yield return part;
            }
        }

        if (Members.Count() == 0)
        {
            yield return ";";
        }
        else
        {
            yield return "\n";

            yield return indent;
            yield return "{";
            yield return "\n";

            foreach (var part in Members.Select(member => member.Render(indent.Next())).SeparatedBy("\n\n"))
            {
                yield return part;
            }
            yield return "\n";

            yield return indent;
            yield return "}";
        }
    }
}
