#!/usr/bin/dotnet run
#:project ../src/Bottleneko.Helpers/Bottleneko.Helpers.csproj
#:project ../src/Bottleneko.BindingsGenerator/Bottleneko.BindingsGenerator.csproj
#:property PublishAot=false

using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using Bottleneko.BindingsGenerator;
using Bottleneko.Helpers;

Cli.PrintLogo();

static void CheckExports(string filename, string contents)
{
    var re = ImportRegex();
    foreach (var match in re.Matches(contents).Cast<Match>())
    {
        if (match.Groups["ImportPath"].Value.Contains("/internal/") && match.Groups["ImportPath"].Value != "./internal/export.ts")
        {
            throw new Exception($"Detected illegal export: {filename} references {match.Groups["ImportPath"].Value}");
        }
    }
}

Pipeline.Start("Generating bindings", async display =>
{
    display.Step("Checking prerequisites", () =>
    {
        if (!File.Exists("Bottleneko.slnx"))
        {
            throw new Exception("This script must be run from the root directory of the project");
        }
    });

    display.Step("Generating bindings", () =>
    {
        Directory.CreateDirectory("./src/Bottleneko.ScriptRuntime/neko/internal/api");

        display.Step("Generating API bindings", () => Generator.GenerateApi("./src/Bottleneko.Client/src/lib/api/bottleneko.gen.ts", "./src/Bottleneko.Client/src/lib/api/rpc.gen.ts", includeImportExtensions: false));
        display.Step("Generating script bindings", () => Generator.GenerateApi("./src/Bottleneko.ScriptRuntime/neko/internal/api/bottleneko.gen.ts", "./src/Bottleneko.ScriptRuntime/neko/internal/api/rpc.gen.ts", includeImportExtensions: true));
    });

    await display.Step("Packaging script bindings", async () =>
    {
        display.Run("deno", ["task", "build"], "./src/Bottleneko.ScriptRuntime", "Building packages");

        await display.Step("Archiving files", async () =>
        {
            using var archive = await display.Step("Creating archive", async () =>
            {
                return await ZipArchive.CreateAsync(File.Open("./src/Bottleneko.Client/src/lib/script_bindings.zip", FileMode.Create, FileAccess.Write), ZipArchiveMode.Create, false, Encoding.UTF8);
            });

            await display.Step("Adding files", async () =>
            {
                foreach (var file in Directory.GetFiles("./src/Bottleneko.ScriptRuntime/dist", "*.*", SearchOption.AllDirectories).Order())
                {
                    var entry = archive.CreateEntry(Path.GetRelativePath("./src/Bottleneko.ScriptRuntime/dist", file).Replace("\\", "/"), CompressionLevel.SmallestSize);
                    entry.ExternalAttributes = 0;
                    entry.LastWriteTime = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
                    using var stream = await entry.OpenAsync();
                    if (file.EndsWith(".ts", StringComparison.OrdinalIgnoreCase) && !file.Contains("internal"))
                    {
                        var source = await File.ReadAllTextAsync(file);
                        CheckExports(file, source);
                        await stream.WriteAsync(Encoding.UTF8.GetBytes(source));
                    }
                    else
                    {
                        using var source = File.OpenRead(file);
                        await source.CopyToAsync(stream);
                    }
                }
            });
        });
    });

    await display.Step("Packaging script runtime", async () =>
    {
        var files = display.Run("git", ["ls-files", "-co", "--exclude-standard"], "./src/Bottleneko.ScriptRuntime", "Getting file listing").Split('\n').Order();

        await display.Step("Archiving files", async () =>
        {
            using var archive = await display.Step("Creating archive", async () =>
            {
                return await ZipArchive.CreateAsync(File.Open("./src/Bottleneko.Core/script_runtime.zip", FileMode.Create, FileAccess.Write), ZipArchiveMode.Create, false, Encoding.UTF8);
            });
            await display.Step($"Adding files", async () =>
            {
                foreach (var file in files.Where(name => !string.IsNullOrWhiteSpace(name)))
                {
                    var relativePath = file.Replace("\\", "/");
                    if (relativePath.Contains('/'))
                    {
                        var entry = archive.CreateEntry(relativePath, CompressionLevel.SmallestSize);
                        entry.ExternalAttributes = 0;
                        entry.LastWriteTime = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
                        using var stream = await entry.OpenAsync();
                        if (file.EndsWith(".ts", StringComparison.OrdinalIgnoreCase) && !file.Contains("internal"))
                        {
                            var source = await File.ReadAllTextAsync(Path.Combine(".", "src", "Bottleneko.ScriptRuntime", file));
                            CheckExports(file, source);
                            await stream.WriteAsync(Encoding.UTF8.GetBytes(source));
                        }
                        else
                        {
                            using var source = File.OpenRead(Path.Combine(".", "src", "Bottleneko.ScriptRuntime", file));
                            await source.CopyToAsync(stream);
                        }
                    }
                }
            });
        });
    });
});

partial class Program
{
    [GeneratedRegex(@"^import(?:type\s+)?\s+.+?\s+from\s+(['""])(?<ImportPath>.+?)\1;?\s+$", RegexOptions.Multiline)]
    private static partial Regex ImportRegex();
}