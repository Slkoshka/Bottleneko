namespace Bottleneko.SourceGenerator.Source;

using Argument = (string Type, string Name);

class ArgumentsDeclaration(params IEnumerable<Argument> arguments) : List<Argument>(arguments)
{
    private IEnumerable<string> RenderArgument(Argument argument)
    {
        yield return argument.Type;
        yield return " ";
        yield return argument.Name;
    }

    public IEnumerable<string> Render()
    {
        return this.Select(RenderArgument).SeparatedBy(", ");
    }
}
