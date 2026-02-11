namespace Bottleneko.SourceGenerator.Source;

struct Indentation
{
    private static readonly List<string> _indents = [];
    private int _depth;

    public Indentation Next()
    {
        return new Indentation()
        {
            _depth = _depth + 1,
        };
    }

    public override readonly string ToString()
    {
        while (_indents.Count <= _depth)
        {
            _indents.Add(new string(' ', _indents.Count * 4));
        }

        return _indents[_depth];
    }

    public static implicit operator string(Indentation indent) => indent.ToString();
}
