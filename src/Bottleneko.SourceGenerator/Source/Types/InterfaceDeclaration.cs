namespace Bottleneko.SourceGenerator.Source.Types;

class InterfaceDeclaration(string name) : StructuredTypeDeclaration
{
    public string Name => name;

    protected override IEnumerable<string> RenderType()
    {
        if (IsPartial)
        {
            yield return "partial ";
        }

        yield return "interface ";
        yield return name;
    }
}
