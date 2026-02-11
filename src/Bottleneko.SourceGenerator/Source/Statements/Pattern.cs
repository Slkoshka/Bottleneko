namespace Bottleneko.SourceGenerator.Source.Statements;

class Pattern(IEnumerable<string> code)
{
    public Pattern(string code) : this([code])
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
