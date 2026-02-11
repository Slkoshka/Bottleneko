namespace Bottleneko.SourceGenerator.Source.Statements;

class BreakStatement : IStatement
{
    public IEnumerable<string> Render(Indentation indent)
    {
        yield return indent;
        yield return "break;";
    }
}
