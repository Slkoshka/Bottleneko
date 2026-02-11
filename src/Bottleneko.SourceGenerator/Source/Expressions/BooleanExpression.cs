namespace Bottleneko.SourceGenerator.Source.Expressions;

class BooleanExpression(bool value) : ICompileTimeExpression
{
    public IEnumerable<string> Render()
    {
        yield return value ? "true" : "false";
    }
}
