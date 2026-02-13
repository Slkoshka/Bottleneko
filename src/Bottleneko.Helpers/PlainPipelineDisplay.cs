using Spectre.Console;
using Spectre.Console.Rendering;

namespace Bottleneko.Helpers;

class PlainPipelineDisplay : PipelineDisplayBase
{
    private int _depth = 0;

    public override string Run(string executable, string[] args, string workingDir = ".", string? description = null)
    {
        return Step(FormatCommandLine(executable, args), () =>
        {;
            return Cli.Run(executable, args, workingDir, line => AnsiConsole.MarkupLine($"[gray] > {Markup.Escape(line)}[/]"));
        });
    }

    protected override T Step<T>(string name, Func<T> action, IRenderable? content)
    {
        _depth++;
        try
        {
            AnsiConsole.MarkupLine($"[bold]{new string(' ', _depth * 2)}{Markup.Escape(name)}[/]");
            return action();
        }
        finally
        {
            _depth--;
        }
    }

    public static void Start(string name, Action<IPipelineDisplay> action)
    {
        AnsiConsole.MarkupLine($"[bold dodgerblue1]{Markup.Escape(name)}[/]");
        action(new PlainPipelineDisplay());
    }
}
