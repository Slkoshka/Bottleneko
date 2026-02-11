namespace Bottleneko.SourceGenerator.Source.Statements;

interface IStatement
{
    IEnumerable<string> Render(Indentation indent);
}
