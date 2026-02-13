#!/usr/bin/dotnet run
#:project ../src/Bottleneko.Helpers/Bottleneko.Helpers.csproj
#:project ../src/Bottleneko.BindingsGenerator/Bottleneko.BindingsGenerator.csproj
#:property PublishAot=false

using System.IO.Compression;
using System.Text;
using Bottleneko.BindingsGenerator;
using Bottleneko.Helpers;

Cli.PrintLogo();

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
                    using var source = File.OpenRead(file);
                    await source.CopyToAsync(stream);
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
                        using var source = File.OpenRead(Path.Combine(".", "src", "Bottleneko.ScriptRuntime", file));
                        await source.CopyToAsync(stream);
                    }
                }
            });
        });
    });
});
