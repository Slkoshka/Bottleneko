namespace Bottleneko.SourceGenerator.Source.Types;

class RecordDeclaration(string name, ArgumentsDeclaration? constuctor) : StructuredTypeDeclaration
{
    public string Name => name;
    public bool IsAbstract { get; init; } = false;
    public bool IsStruct { get; init; } = false;

    protected override IEnumerable<string> RenderType()
    {
        if (IsAbstract)
        {
            yield return "abstract ";
        }

        if (IsPartial)
        {
            yield return "partial ";
        }

        yield return "record ";

        if (IsStruct)
        {
            yield return "struct ";
        }

        yield return name;

        if (constuctor is not null)
        {
            yield return "(";
            foreach (var part in constuctor.Render())
            {
                yield return part;
            }
            yield return ")";
        }
    }
}
