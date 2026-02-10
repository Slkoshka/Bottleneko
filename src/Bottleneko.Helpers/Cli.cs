using System.Diagnostics;
using System.Text;

namespace Bottleneko.Helpers;

enum CliMode
{
    Interactive,
    InteractiveNoColor,
    Plain,
}

class CliStyle(CliMode mode)
{
    public CliMode Mode => mode;
    public string RED => mode == CliMode.Interactive ? "\e[0;31m" : "";
    public string BOLD_RED => mode == CliMode.Interactive ? "\e[1;31m" : "";
    public string BOLD_GREEN => mode == CliMode.Interactive ? "\e[1;32m" : "";
    public string BOLD_YELLOW => mode == CliMode.Interactive ? "\e[1;33m" : "";
    public string RESET => mode != CliMode.Plain ? "\e[0m" : "";
    public string ERASE_FROM_CURSOR => mode != CliMode.Plain ? "\e[0K" : "";
    public string TO_START => mode != CliMode.Plain ? "\e[0G" : "";
    public string SAVE_POS => mode != CliMode.Plain ? "\e7" : "";
    public string RESTORE_POS => mode != CliMode.Plain ? "\e8" : "";
    public string MoveUp(int positions) => mode != CliMode.Plain ? $"\e[{positions}A" : "";
}

public static class Cli
{
    private static readonly CliStyle Style = GetCliStyle();

    private static CliStyle GetCliStyle()
    {
        if (Console.IsOutputRedirected)
        {
            return new(CliMode.Plain);
        }
        else if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("NO_COLOR")))
        {
            return new(CliMode.Interactive);
        }
        else
        {
            return new(CliMode.InteractiveNoColor);
        }
    }

    private static int _stepDepth = 0;
    private static readonly List<int> _subSteps = [];

    public static void Step(string name, Action action) => Step(name, () => { action(); return 0; });

    public static T Step<T>(string name, Func<T> action)
    {
        _stepDepth++;
        _subSteps.Add(1);
        
        var indent = new string(' ', _stepDepth);

        void UpdateStatus(bool isError)
        {
            if (Style.Mode != CliMode.Plain)
            {
                Console.Write($"{Style.SAVE_POS}{Style.MoveUp(_subSteps[^1])}");
            }

            var subStepsCount = _subSteps[^1];
            _subSteps.RemoveAt(_subSteps.Count - 1);
            if (_subSteps.Count > 0)
            {
                _subSteps[^1] += subStepsCount;
            }
            _stepDepth--;

            if (Style.Mode != CliMode.Plain)
            {
                Console.Write($"{Style.TO_START}{(isError ? Style.BOLD_RED : Style.BOLD_GREEN)}{indent}{(isError ? '○' : '●')} {name}{Style.RESET}{Style.ERASE_FROM_CURSOR}{Style.RESTORE_POS}");
            }
        }

        Console.WriteLine($"{Style.BOLD_YELLOW}{indent}○ {name}...{Style.RESET}");

        T result;

        try
        {
            result = action();
            if (result is Task task)
            {
                task.Wait();
            }
        }
        catch (Exception e)
        {
            UpdateStatus(true);

            if (_stepDepth > 0)
            {
                throw;
            }
            else
            {
                Console.WriteLine();
                Console.WriteLine($"{Style.RED}{e}{Style.RESET}");
                Console.WriteLine();

                Environment.Exit(1);
                return default!;
            }
        }

        UpdateStatus(false);
        return result;
    }

    public static string Run(string executable, string[] args, string workingDir = ".", string? description = null)
    {
        return Step(description ?? $"Running '{executable}'", () =>
        {
            var startInfo = new ProcessStartInfo()
            {
                FileName = executable.Contains(Path.DirectorySeparatorChar) || executable.Contains(Path.AltDirectorySeparatorChar) ? executable : FileSystem.FindInPath(executable),
                WorkingDirectory = workingDir,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
            };
            Array.ForEach(args, startInfo.ArgumentList.Add);

            var output = new StringBuilder();
            using var process = new Process()
            {
                StartInfo = startInfo,
            };

            if (Style.Mode == CliMode.Plain)
            {
                process.ErrorDataReceived += (_, e) => { output.AppendLine(e.Data); Console.WriteLine(e.Data); };
                process.OutputDataReceived += (_, e) => { output.AppendLine(e.Data); Console.WriteLine(e.Data); };
            }
            else
            {
                process.ErrorDataReceived += (_, e) => output.AppendLine(e.Data);
                process.OutputDataReceived += (_, e) => output.AppendLine(e.Data);
            }

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
            process.WaitForExit();

            if (process.ExitCode != 0)
            {
                if (Style.Mode == CliMode.Plain)
                {
                    throw new Exception($"{executable} exited with code {process.ExitCode}");
                }
                else
                {
                    throw new Exception($"{executable} exited with code {process.ExitCode}\n\nCommand output:\n{output.ToString().TrimEnd()}");
                }
            }

            return output.ToString();
        });
    }

    public static void DotnetRun(string project, Span<string> args, string workingDir = ".", string? description = null) =>
        Run(
            "dotnet",
            ["run", "--project", project, "--", ..args],
            workingDir: workingDir,
            description: description ?? $"{Path.GetFileNameWithoutExtension(Path.GetFileName(project))}: dotnet run"
        );
}
