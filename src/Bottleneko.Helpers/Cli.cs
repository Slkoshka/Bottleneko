using System.Diagnostics;
using System.Text;
using Spectre.Console;

namespace Bottleneko.Helpers;

public static class Cli
{
    public static void PrintLogo()
    {
        AnsiConsole.WriteLine();
        if (AnsiConsole.Profile.Width >= 120)
        {
        AnsiConsole.MarkupLine(@"
  [purple3 on gray7]▌                                                           [/][white on gray7]                                             [/]
  [purple3 on gray7]▌  ░████████                 ░██       ░██    ░██           [/][white on gray7]                                             [/]
  [purple3 on gray7]▌  ░██    ░██                ░██       ░██    ░██           [/][white on gray7]                                             [/]
  [purple3 on gray7]▌  ░██    ░██   ░███████  ░████████ ░████████ ░██  ░███████ [/][white on gray7]                                             [/]
  [purple3 on gray7]▌  ░████████   ░██    ░██    ░██       ░██    ░██ ░██    ░██[/][white on gray7]                       ░██                   [/]
  [purple3 on gray7]▌  ░██     ░██ ░██    ░██    ░██       ░██    ░██ ░█████████[/][white on gray7]                       ░██                   [/]
  [purple3 on gray7]▌  ░██     ░██ ░██    ░██    ░██       ░██    ░██ ░██       [/][white on gray7] ░████████   ░███████  ░██    ░██ ░███████   [/]
  [purple3 on gray7]▌  ░█████████   ░███████      ░████     ░████ ░██  ░███████ [/][white on gray7] ░██    ░██ ░██    ░██ ░██   ░██ ░██    ░██  [/]
  [purple3 on gray7]▌                                                           [/][white on gray7] ░██    ░██ ░█████████ ░███████  ░██    ░██  [/]
  [purple3 on gray7]▌                                                           [/][white on gray7] ░██    ░██ ░██        ░██   ░██ ░██    ░██  [/]
  [purple3 on gray7]▌                                                           [/][white on gray7] ░██    ░██  ░███████  ░██    ░██ ░███████   [/]
  [purple3 on gray7]▌                                                           [/][white on gray7]                                             [/]
");
        }
        else
        {
            AnsiConsole.MarkupLine(@"
 [purple3 on gray7]▌       [/][white on gray7]     [/]
 [purple3 on gray7]▌ Bottle[/][white on gray7]neko [/]
 [purple3 on gray7]▌       [/][white on gray7]     [/]
");
        }
    }

    public static string Run(string executable, string[] args, string workingDir = ".", Action<string>? lineCallback = null)
    {
        var startInfo = new ProcessStartInfo()
        {
            FileName = executable.Contains(Path.DirectorySeparatorChar) || executable.Contains(Path.AltDirectorySeparatorChar) ? executable : FileSystem.FindInPath(executable),
            WorkingDirectory = workingDir,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            Environment =
            {
                { "NO_COLOR", "1" },
            },
        };
        Array.ForEach(args, startInfo.ArgumentList.Add);

        var output = new StringBuilder();
        using var process = new Process()
        {
            StartInfo = startInfo,
        };

        void AddOutput(object sender, DataReceivedEventArgs e)
        {
            if (e.Data is not null)
            {
                output.AppendLine(e.Data);
                lineCallback?.Invoke(e.Data);
            }
        }

        process.ErrorDataReceived += AddOutput;
        process.OutputDataReceived += AddOutput;

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        process.WaitForExit();

        if (process.ExitCode != 0)
        {
            throw new Exception($"{executable} exited with code {process.ExitCode}");
        }

        return output.ToString();
    }
}
