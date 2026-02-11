namespace Bottleneko.SourceGenerator.Source.Expressions;

class IdentifierExpression(string name) : IExpression
{
    public IEnumerable<string> Render()
    {
        yield return name;
    }
}
