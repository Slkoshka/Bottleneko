using Spectre.Console;
using Spectre.Console.Rendering;

namespace Bottleneko.Helpers;

class DefaultPipelineDisplay : PipelineDisplayBase
{
    private readonly Tree _tree;
    private readonly LiveDisplayContext _ctx;
    private readonly List<IHasTreeNodes> _steps = [];

    public DefaultPipelineDisplay(string name, LiveDisplayContext context)
    {
        _ctx = context;
        _tree = new Tree(new Markup($"[bold dodgerblue1]{Markup.Escape(name)}[/]"));
        _steps.Add(_tree);
        context.UpdateTarget(_tree);
        context.Refresh();
    }

    protected override T Step<T>(string name, Func<T> action, IRenderable? content)
    {
        {
            var label = new Markup($"[bold orange1]○ {Markup.Escape(name)}[/]");
            var node = new TreeNode(content is null ? label : new Rows(label, content));
            _steps[^1].AddNode(node);
            _steps.Add(node);
            _ctx.Refresh();
        }

        void OverrideLabel(IRenderable label)
        {
            _steps[^2].Nodes.Remove((TreeNode)_steps[^1]);
            var node = new TreeNode(content is null ? label : new Rows(label, content));
            node.AddNodes(_steps[^1].Nodes);
            _steps[^2].AddNode(node);
            _steps.Remove(_steps[^1]);
            _ctx.Refresh();
        }

        T result;
        try
        {
            result = action();
            if (result is Task t)
            {
                t.Wait();
            }
        }
        catch
        {
            OverrideLabel(new Markup($"[bold red]○ {Markup.Escape(name)}[/]"));
            throw;
        }

        OverrideLabel(new Markup($"[bold green]● {Markup.Escape(name)}[/]"));

        return result;
    }

    public override string Run(string executable, string[] args, string workingDir = ".", string? description = null)
    {
        const int displayLines = 10;
        var outputView = new Table().Border(TableBorder.Rounded).Width(120);
        outputView.AddColumn(new TableColumn(new LineRenderable(new Text(FormatCommandLine(executable, args)))));

        for (var i = 0; i < displayLines; i++)
        {
            outputView.AddEmptyRow();
        }

        return Step(description ?? $"Running '{executable}'", () =>
        {
            void AddOutput(string text)
            {
                if (text is null)
                {
                    return;
                }
                var formatted = $"[gray]{Markup.Escape(text)}[/]";

                while (outputView.Rows.Count >= displayLines)
                {
                    outputView.RemoveRow(0);
                }
                outputView.AddRow(new LineRenderable(new Markup(formatted)));
                _ctx.Refresh();
            }

            return Cli.Run(executable, args, workingDir, AddOutput);
        }, outputView);
    }

    public static void Start(string name, Action<IPipelineDisplay> action)
    {
        AnsiConsole.WriteLine();
        AnsiConsole.WriteLine();
        AnsiConsole.Live(new Text("")).Start(ctx => action(new DefaultPipelineDisplay(name, ctx)));
    }
}
