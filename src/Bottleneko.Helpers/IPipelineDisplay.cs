namespace Bottleneko.Helpers;

public interface IPipelineDisplay
{
    void Step(string name, Action action);
    T Step<T>(string name, Func<T> action);
    string Run(string executable, string[] args, string workingDir = ".", string? description = null);

    public string DotnetRun(string project, Span<string> args, string workingDir = ".", string? description = null) =>
        Run(
            "dotnet",
            ["run", "--project", project, "--", ..args],
            workingDir: workingDir,
            description: description ?? $"{Path.GetFileNameWithoutExtension(Path.GetFileName(project))}: dotnet run"
        );
}
