namespace Bottleneko.SourceGenerator.Source.Statements;

class Body(params IEnumerable<IStatement> statements) : List<IStatement>(statements), IStatement
{
    public IEnumerable<string> Render(Indentation indent)
    {
        yield return indent;
        yield return "{\n";

        foreach (var statement in this)
        {
            foreach (var part in statement.Render(indent.Next()))
            {
                yield return part;
            }
            yield return "\n";
        }

        yield return indent;
        yield return "}";
    }
}
