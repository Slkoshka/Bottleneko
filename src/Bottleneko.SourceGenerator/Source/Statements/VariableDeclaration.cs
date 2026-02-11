using Bottleneko.SourceGenerator.Source.Expressions;

namespace Bottleneko.SourceGenerator.Source.Statements;

class VariableDeclaration(string type, string name, IExpression? value = null) : IStatement
{
    public IEnumerable<string> Render(Indentation indent)
    {
        yield return indent;
        yield return type;
        yield return " ";
        yield return name;
        if (value is not null)
        {
            yield return " = ";
            foreach (var part in value.Render())
            {
                yield return part;
            }
        }
        yield return ";";
    }
}
