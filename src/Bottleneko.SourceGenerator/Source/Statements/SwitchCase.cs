using Bottleneko.SourceGenerator.Source.Expressions;

namespace Bottleneko.SourceGenerator.Source.Statements;

class SwitchCase(Pattern Pattern, IExpression? Condition = null, Body? Body = null)
{
    public bool HasBody => Body is not null;

    public IEnumerable<string> Render(Indentation indent)
    {
        yield return indent;
        yield return "case ";
        foreach (var part in @Pattern.Render())
        {
            yield return part;
        }

        if (@Condition is not null)
        {
            yield return " when ";
            foreach (var part in Condition.Render())
            {
                yield return part;
            }
        }
        yield return ":\n";

        if (Body is not null)
        {
            foreach (var part in Body.Render(indent))
            {
                yield return part;
            }
            yield return "\n";
        }
    }
}
