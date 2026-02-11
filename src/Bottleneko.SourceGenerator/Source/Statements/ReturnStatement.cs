using Bottleneko.SourceGenerator.Source.Expressions;

namespace Bottleneko.SourceGenerator.Source.Statements;

class ReturnStatement(IExpression? expression) : IStatement
{
    public IEnumerable<string> Render(Indentation indent)
    {
        yield return indent;
        yield return "return";
        if (expression is not null)
        {
            yield return " ";
            foreach (var part in expression.Render())
            {
                yield return part;
            }
        }
        yield return ";";
    }
}
