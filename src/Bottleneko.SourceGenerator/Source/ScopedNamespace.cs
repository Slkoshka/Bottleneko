namespace Bottleneko.SourceGenerator.Source;

class ScopedNamespace(string name, params IFileRootDeclaration[] declarations) : List<IFileRootDeclaration>(declarations), IFileRootDeclaration
{
    public IEnumerable<string> Render(Indentation indent)
    {
        yield return indent;
        yield return "namespace ";
        yield return name;
        yield return "\n";

        yield return indent;
        yield return "{\n";

        foreach (var part in this.Select(declaration => declaration.Render(indent.Next())).SeparatedBy("\n\n"))
        {
            yield return part;
        }
        if (Count > 0)
        {
            yield return "\n";
        }

        yield return indent;
        yield return "}";
    }
}
