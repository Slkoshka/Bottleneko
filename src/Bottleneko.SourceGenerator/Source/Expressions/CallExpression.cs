namespace Bottleneko.SourceGenerator.Source.Expressions;

class CallExpression(string target) : IExpression
{
    public List<IExpression> Arguments { get; init; } = [];

    public IEnumerable<string> Render()
    {
        yield return target;
        yield return "(";
        foreach (var part in Arguments.Select(argument => argument.Render()).SeparatedBy(", "))
        {
            yield return part;
        }
        yield return ")";
    }
}
