namespace Bottleneko.SourceGenerator.Source.Expressions;

class TypeofExpression(string identifier) : ICompileTimeExpression
{
    public IEnumerable<string> Render()
    {
        yield return "typeof(";
        yield return identifier;
        yield return ")";
    }
}
