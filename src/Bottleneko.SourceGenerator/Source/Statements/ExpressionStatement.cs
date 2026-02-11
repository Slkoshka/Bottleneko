using Bottleneko.SourceGenerator.Source.Expressions;

namespace Bottleneko.SourceGenerator.Source.Statements;

class ExpressionStatement(IExpression expression) : IStatement
{
    public IEnumerable<string> Render(Indentation indent)
    {
        yield return indent;
        foreach (var part in expression.Render())
        {
            yield return part;
        }
        yield return ";";
    }
}
