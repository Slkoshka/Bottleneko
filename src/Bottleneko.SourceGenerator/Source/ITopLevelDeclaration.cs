namespace Bottleneko.SourceGenerator.Source;

interface ITopLevelDeclaration
{
    IEnumerable<string> Render(Indentation indent);
}
