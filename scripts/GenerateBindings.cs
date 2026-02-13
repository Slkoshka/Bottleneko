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
                foreach (var file in Directory.GetFiles("./src/Bottleneko.ScriptRuntime/dist", "*.*", SearchOption.AllDirectories))
                {
                    await archive.CreateEntryFromFileAsync(file, Path.GetRelativePath("./src/Bottleneko.ScriptRuntime/dist", file).Replace("\\", "/"), CompressionLevel.SmallestSize);
                }
            });
        });
    });

    await display.Step("Packaging script runtime", async () =>
    {
        var files = display.Run("git", ["ls-files", "-co", "--exclude-standard"], "./src/Bottleneko.ScriptRuntime", "Getting file listing").Split('\n');

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
                        await archive.CreateEntryFromFileAsync(Path.Combine(".", "src", "Bottleneko.ScriptRuntime", file), relativePath, CompressionLevel.SmallestSize);
                    }
                }
            });
        });
    });
});
