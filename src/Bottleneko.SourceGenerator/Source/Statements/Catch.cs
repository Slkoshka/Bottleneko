using Bottleneko.SourceGenerator.Source.Expressions;

namespace Bottleneko.SourceGenerator.Source.Statements;

class Catch(Pattern? Pattern, IExpression? Condition, Body Body)
{
    public bool HasBody => Body is not null;

    public IEnumerable<string> Render(Indentation indent)
    {
        if (Body is null)
        {
            throw new Exception("Catch body must not be null");
        }

        yield return indent.Next();
        yield return "catch";

        if (Pattern is not null)
        {
            yield return " (";
            foreach (var part in @Pattern.Render())
            {
                yield return part;
            }
            yield return ")";
        }

        if (@Condition is not null)
        {
            yield return " when (";
            foreach (var part in Condition.Render())
            {
                yield return part;
            }
            yield return ")";
        }
        yield return "\n";

        foreach (var part in Body.Render(indent.Next()))
        {
            yield return part;
        }
    }

}
