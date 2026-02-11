namespace Bottleneko.SourceGenerator.Source.Types;

class ClassDeclaration(string name) : StructuredTypeDeclaration
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

        yield return "class ";
        yield return name;
    }
}
