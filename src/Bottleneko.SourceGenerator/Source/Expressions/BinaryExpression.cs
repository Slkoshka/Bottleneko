namespace Bottleneko.SourceGenerator.Source.Expressions;

enum BinaryOperator
{
    Assignment,
}

class BinaryExpression(IExpression left, BinaryOperator @operator, IExpression right) : IExpression
{
    public IEnumerable<string> Render()
    {
        foreach (var part in left.Render())
        {
            yield return part;
        }

        switch (@operator)
        {
            case BinaryOperator.Assignment:
                yield return " = ";
                break;
            
            default:
                throw new Exception("Unknown operator");
        }

        foreach (var part in right.Render())
        {
            yield return part;
        }
    }
}
