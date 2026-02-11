namespace Bottleneko.SourceGenerator.Source.Expressions;

class StringExpression(string @string) : ICompileTimeExpression
{
    public IEnumerable<string> Render()
    {
        yield return "\"";

        if (@string.Any(chr => chr is '\"' or < ' '))
        {
            foreach (var chr in @string)
            {
                switch (chr)
                {
                    case '\"':
                        yield return "\\\"";
                        break;

                    case < ' ':
                        yield return "\\x";
                        yield return ((int)chr).ToString("X2");
                        break;

                    default:
                        yield return new string(chr, 1);
                        break;
                }
            }
        }
        else
        {
            yield return @string;
        }

        yield return "\"";
    }
}
