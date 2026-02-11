namespace Bottleneko.SourceGenerator.Source;

class FileNamespace(string name) : ITopLevelDeclaration
{
    public IEnumerable<string> Render(Indentation indent)
    {
        yield return indent;
        yield return "namespace ";
        yield return name;
        yield return ";";
    }

    public static implicit operator FileNamespace(string @namespace) => new(@namespace);
}
