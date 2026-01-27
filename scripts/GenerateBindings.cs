#!/usr/bin/dotnet run
#:project ../Bottleneko.Helpers/Bottleneko.Helpers.csproj
#:project ../Bottleneko.CodeGenerator/Bottleneko.CodeGenerator.csproj
#:property PublishAot=false

using System.IO.Compression;
using System.Text;
using Bottleneko.CodeGenerator;
using static Bottleneko.Helpers.Cli;

Step("Checking prerequisites", () =>
{
    if (!File.Exists("Bottleneko.slnx"))
    {
        throw new Exception("This script must be run from the root directory of the project");
    }
});

Step("Generating bindings", () =>
{
    Directory.CreateDirectory("./Bottleneko.ScriptRuntime/neko/internal/api");

    Step("Generating API bindings", () => Generator.GenerateApi("./Bottleneko.Client/src/lib/api/bottleneko.gen.ts", "./Bottleneko.Client/src/lib/api/rpc.gen.ts", includeImportExtensions: false));
    Step("Generating script bindings", () => Generator.GenerateApi("./Bottleneko.ScriptRuntime/neko/internal/api/bottleneko.gen.ts", "./Bottleneko.ScriptRuntime/neko/internal/api/rpc.gen.ts", includeImportExtensions: true));
});

await Step("Packaging script bindings", async () =>
{
    Run("deno", ["task", "build"], "./Bottleneko.ScriptRuntime", "Building packages");

    await Step("Archiving files", async () =>
    {
        using var archive = await Step("Creating archive", async () =>
        {
            return await ZipArchive.CreateAsync(File.Open("./Bottleneko.Client/src/lib/script_bindings.zip", FileMode.Create, FileAccess.Write), ZipArchiveMode.Create, false, Encoding.UTF8);
        });

        await Step("Adding files", async () =>
        {
            foreach (var file in Directory.GetFiles("./Bottleneko.ScriptRuntime/dist", "*.*", SearchOption.AllDirectories))
            {
                await archive.CreateEntryFromFileAsync(file, Path.GetRelativePath("./Bottleneko.ScriptRuntime/dist", file).Replace("\\", "/"), CompressionLevel.SmallestSize);
            }
        });
    });
});

await Step("Packaging script runtime", async () =>
{
    var files = Run("git", ["ls-files", "-co", "--exclude-standard"], "./Bottleneko.ScriptRuntime", "Getting file listing").Split('\n');

    await Step("Archiving files", async () =>
    {
        using var archive = await Step("Creating archive", async () =>
        {
            return await ZipArchive.CreateAsync(File.Open("./Bottleneko.Core/script_runtime.zip", FileMode.Create, FileAccess.Write), ZipArchiveMode.Create, false, Encoding.UTF8);
        });
        await Step($"Adding files", async () =>
        {
            foreach (var file in files.Where(name => !string.IsNullOrWhiteSpace(name)))
            {
                var relativePath = file.Replace("\\", "/");
                if (relativePath.Contains('/'))
                {
                    await archive.CreateEntryFromFileAsync(Path.Combine(".", "Bottleneko.ScriptRuntime", file), relativePath, CompressionLevel.SmallestSize);
                }
            }
        });
    });
});
