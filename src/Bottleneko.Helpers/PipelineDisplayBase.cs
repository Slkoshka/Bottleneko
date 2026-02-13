using Spectre.Console.Rendering;

namespace Bottleneko.Helpers;

abstract class PipelineDisplayBase : IPipelineDisplay
{
    public void Step(string name, Action action)
    {
        Step(name, () => { action(); return 0; });
    }

    public T Step<T>(string name, Func<T> action)
    {
        return Step(name, action, null);
    }

    protected abstract T Step<T>(string name, Func<T> action, IRenderable? content);
    public abstract string Run(string executable, string[] args, string workingDir = ".", string? description = null);

    protected static string EscapeCommandLine(string text)
    {
        text = text.Replace("\'", "\\\'");
        if (text.Contains(' '))
        {
            text = $"\'{text}\'";
        }

        return text;
    }

    protected static string FormatCommandLine(string executable, IEnumerable<string> args)
    {
        return $"{EscapeCommandLine(executable)}{string.Concat(args.Select(arg => " " + EscapeCommandLine(arg)))}";
    }
}
