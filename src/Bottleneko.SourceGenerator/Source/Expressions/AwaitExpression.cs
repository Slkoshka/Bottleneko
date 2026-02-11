namespace Bottleneko.SourceGenerator.Source.Expressions;

class AwaitExpression(IExpression expression) : IExpression
{
    public IEnumerable<string> Render()
    {
        yield return "await ";
        foreach (var part in expression.Render())
        {
            yield return part;
        }
    }
}
