namespace Bottleneko.SourceGenerator.Source.Expressions;

class CollectionUnpackExpression(IExpression expression) : ICollectionExpressionItem
{
    public IEnumerable<string> Render()
    {
        yield return "..";
        foreach (var part in expression.Render())
        {
            yield return part;
        }
    }
}
