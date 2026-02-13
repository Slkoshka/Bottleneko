using Spectre.Console;

namespace Bottleneko.Helpers;

public static class Pipeline
{
    public static void Start(string name, Action<IPipelineDisplay> action)
    {
        try
        {
            if (AnsiConsole.Profile.Capabilities.Interactive)
            {
                DefaultPipelineDisplay.Start(name, action);
            }
            else
            {
                PlainPipelineDisplay.Start(name, action);
            }
        }
        catch (Exception e)
        {
            AnsiConsole.WriteException(e);
        }
    }

    public static void Start(string name, Func<IPipelineDisplay, Task> action)
    {
        Start(name, display => action(display).Wait());
    }
}
