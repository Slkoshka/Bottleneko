namespace Bottleneko.SourceGenerator.Source.Expressions;

class CollectionExpression(params IEnumerable<ICollectionExpressionItem> items) : List<ICollectionExpressionItem>(items), IExpression
{
    public IEnumerable<string> Render()
    {
        yield return "[";
        foreach (var part in this.Select(item => item.Render()).SeparatedBy(", "))
        {
            yield return part;
        }
        yield return "]";
    }
}
