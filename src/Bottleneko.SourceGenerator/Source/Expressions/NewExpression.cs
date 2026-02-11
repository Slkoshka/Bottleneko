namespace Bottleneko.SourceGenerator.Source.Expressions;

class NewExpression(string type) : IExpression
{
    public List<IExpression> Arguments { get; init; } = [];

    public IEnumerable<string> Render()
    {
        yield return "new ";
        yield return type;
        yield return "(";
        foreach (var part in Arguments.Select(argument => argument.Render()).SeparatedBy(", "))
        {
            yield return part;
        }
        yield return ")";
    }
}
