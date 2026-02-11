namespace Bottleneko.SourceGenerator.Source.Types;

class StructDeclaration(string name) : StructuredTypeDeclaration
{
    public string Name => name;
    public bool IsAbstract { get; init; } = false;

    protected override IEnumerable<string> RenderType()
    {
        if (IsAbstract)
        {
            yield return "abstract ";
        }

        if (IsPartial)
        {
            yield return "partial ";
        }

        yield return "struct ";
        yield return name;
    }
}
