using Bottleneko.SourceGenerator.Source.Types;

namespace Bottleneko.SourceGenerator.Source;

static class SourceFile
{
    public static string Generate(FileNamespace? @namespace, params ITypeDeclaration[] types)
    {
        IEnumerable<string> parts;

        if (@namespace is null)
        {
            parts = [
                ..types.Select(type => type.Render(new Indentation())).SeparatedBy("\n\n"),
                "\n",
            ];
        }
        else
        {
            parts = [
                ..@namespace.Render(new Indentation()),
                "\n\n",
                ..types.Select(type => type.Render(new Indentation())).SeparatedBy("\n\n"),
                "\n",
            ];
        }

        return string.Concat(parts);
    }

    public static string Generate(params IFileRootDeclaration[] declarations)
    {
        IEnumerable<string> parts = [
            ..declarations.Select(type => type.Render(new Indentation())).SeparatedBy("\n\n"),
            "\n",
        ];

        return string.Concat(parts);
    }
}
