using System.Diagnostics;
using System.Text;

namespace Bottleneko.Helpers;

public static class Cli
{
    private const string RED = "\e[0;31m";
    private const string BOLD_RED = "\e[1;31m";
    private const string BOLD_GREEN = "\e[1;32m";
    private const string BOLD_YELLOW = "\e[1;33m";
    private const string RESET = "\e[0m";
    private const string ERASE_FROM_CURSOR = "\e[0K";
    private const string TO_START = "\e[0G";
    private const string SAVE_POS = "\e7";
    private const string RESTORE_POS = "\e8";

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
            Console.Write($"{SAVE_POS}\e[{_subSteps[^1]}A");
            var subStepsCount = _subSteps[^1];
            _subSteps.RemoveAt(_subSteps.Count - 1);
            if (_subSteps.Count > 0)
            {
                _subSteps[^1] += subStepsCount;
            }
            _stepDepth--;

            Console.Write($"{TO_START}{(isError ? BOLD_RED : BOLD_GREEN)}{indent}{(isError ? '○' : '●')} {name}{RESET}{ERASE_FROM_CURSOR}{RESTORE_POS}");
        }

        Console.WriteLine($"{BOLD_YELLOW}{indent}○ {name}...{RESET}");

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
                Console.WriteLine($"{RED}{e}{RESET}");
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

            process.ErrorDataReceived += (_, e) => output.AppendLine(e.Data);
            process.OutputDataReceived += (_, e) => output.AppendLine(e.Data);

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
            process.WaitForExit();

            if (process.ExitCode != 0)
            {
                throw new Exception($"{executable} exited with code {process.ExitCode}\n\nCommand output:\n{output.ToString().TrimEnd()}");
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
