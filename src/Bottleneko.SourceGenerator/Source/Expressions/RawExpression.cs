namespace Bottleneko.SourceGenerator.Source.Expressions;

class RawExpression(IEnumerable<string> code) : IExpression
{
    public RawExpression(string code) : this([code])
    {
    }

    public IEnumerable<string> Render()
    {
        foreach (var part in code)
        {
            yield return part;
        }
    }
}
