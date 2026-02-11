using Bottleneko.SourceGenerator.Source.Expressions;

namespace Bottleneko.SourceGenerator.Source.Statements;

class SwitchStatement(IExpression input) : IStatement
{
    public List<SwitchCase> Cases { get; init; } = [];
    public Body? Default { get; init; }

    private static IEnumerable<string> RenderDefault(Indentation indent, Body body)
    {
        yield return indent;
        yield return "default:\n";
        foreach (var part in @body.Render(indent))
        {
            yield return part;
        }
        yield return "\n";
    }

    public IEnumerable<string> Render(Indentation indent)
    {
        if (Cases.Count > 0 && !Cases.Last().HasBody && Default is null)
        {
            throw new Exception("Last switch case must have a body");
        }

        yield return indent;
        yield return "switch (";
        foreach (var part in input.Render())
        {
            yield return part;
        }
        yield return ")\n";

        yield return indent;
        yield return "{\n";

        if (Default is null)
        {
            foreach (var part in Cases.Select(@case => @case.Render(indent.Next())).SeparatedBy("\n"))
            {
                yield return part;
            }
        }
        else
        {
            foreach (var part in Cases.Select(@case => @case.Render(indent.Next())).Append(RenderDefault(indent.Next(), Default)).SeparatedBy("\n"))
            {
                yield return part;
            }
        }

        yield return indent;
        yield return "}";
    }
}
