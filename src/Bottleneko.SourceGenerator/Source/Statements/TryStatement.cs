namespace Bottleneko.SourceGenerator.Source.Statements;

class TryStatement(Body @try, IEnumerable<Catch> catches, Body? @finally) : IStatement
{
    public IEnumerable<string> Render(Indentation indent)
    {
        if (catches.Count() == 0 && @finally is null)
        {
            throw new Exception("try-catch-finally block must either have at least one catch or a finally block");
        }

        yield return indent;
        yield return "try\n";
        foreach (var part in @try.Render(indent))
        {
            yield return part;
        }
        yield return "\n";

        foreach (var @catch in catches)
        {
            foreach (var part in @catch.Render(indent))
            {
                yield return part;
            }
            yield return "\n";
        }

        if (@finally is not null)
        {
            yield return indent;
            yield return "finally\n";
            foreach (var part in @finally.Render(indent))
            {
                yield return part;
            }
        }
    }
}
