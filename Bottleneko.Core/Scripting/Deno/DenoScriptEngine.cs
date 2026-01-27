using System.IO.Compression;
using System.Reflection;
using Bottleneko.Helpers;

namespace Bottleneko.Scripting.Deno;

public class DenoScriptEngine(NekoEnvironment environment)
{
    public static readonly Lazy<string> DenoExecutable = new(DiscoverDeno!, LazyThreadSafetyMode.PublicationOnly);
    public readonly string DenoDir = Path.Combine(environment.DataPath, "scripts", "deno");
    public readonly string PackagesDir = Path.Combine(environment.DataPath, "scripts", "packages");

    private static string? DiscoverDeno()
    {
        if (Path.GetDirectoryName(Assembly.GetEntryAssembly()?.Location) is { } directory)
        {
            var path = Path.Combine(directory, "deno");
            if (File.Exists(path))
            {
                return path;
            }
        }
        
        return FileSystem.FindInPath("deno");
    }

    public async Task InitializeAsync()
    {
        if (DenoExecutable.Value is null)
        {
            throw new Exception("Deno runtime not found");
        }

        FileSystem.Delete(PackagesDir, recursive: true);
        Directory.CreateDirectory(PackagesDir);

        var scriptRuntime = Path.GetDirectoryName(Assembly.GetEntryAssembly()?.Location) is { } directory ? Path.Combine(directory, "script_runtime.zip") : null;

        if (scriptRuntime is null || !File.Exists(scriptRuntime))
        {
            throw new Exception("Cannot find script runtime package");
        }

        using var scriptRuntimeArchive = new ZipArchive(File.OpenRead(scriptRuntime), ZipArchiveMode.Read, false);
        foreach (var entry in scriptRuntimeArchive.Entries.Where(entry => entry.FullName.Contains('/')))
        {
            Directory.CreateDirectory(Path.Combine(PackagesDir, entry.FullName[..entry.FullName.LastIndexOf('/')]));
            await entry.ExtractToFileAsync(Path.Combine(PackagesDir, entry.FullName));
        }
    }
}
