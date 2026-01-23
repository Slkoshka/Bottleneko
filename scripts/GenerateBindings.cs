#!/usr/bin/dotnet run
#:project ../Bottleneko.CliHelpers/Bottleneko.CliHelpers.csproj
#:project ../Bottleneko.CodeGenerator/Bottleneko.CodeGenerator.csproj
#:property PublishAot=false

using System.Text;
using Bottleneko.CodeGenerator;
using static Bottleneko.CliHelpers.Helpers;

Step("Checking prerequisites", () =>
{
    if (!File.Exists("Bottleneko.slnx"))
    {
        throw new Exception("This script must be run from the root directory of the project");
    }
});

Step("Cleaning up files from previous runs", () =>
{
    Delete("./Bottleneko.Core/Scripting/Js/API", recursive: true);
    Delete("./Bottleneko.Client/src/features/scripts/api", recursive: true);
    Delete("./Bottleneko.ScriptAPI/dist", recursive: true);
});

Step("Generating bindings", () =>
{
    Directory.CreateDirectory("./Bottleneko.Core/Scripting/Js/API");
    Directory.CreateDirectory("./Bottleneko.Client/src/lib/scriptApi");

    Step("Generating API bindings", () => Generator.GenerateAPI("./Bottleneko.Client/src/lib/api/dtos.gen.ts"));
    Step("Generating script bindings", () => Generator.GenerateScriptBindings("./Bottleneko.Client/src/lib/scriptApi/bottleneko.gen.d.ts"));
});

Step("Generating type definitions", () =>
{
    File.Copy("./Bottleneko.Client/src/lib/scriptApi/bottleneko.gen.d.ts", "./Bottleneko.ScriptAPI/src/typeDefs/bottleneko.gen.d.ts", overwrite: true);

    Run("npm", ["install"], workingDir: "./Bottleneko.ScriptAPI", description: "Bottleneko.ScriptAPI: npm install");
    Run("npm", ["run", "build", "--", "--declaration", "--outDir", "./dist"], workingDir: "./Bottleneko.ScriptAPI", description: "Bottleneko.ScriptAPI: npm run build");

    Step("Copying source files", () =>
    {
        CopyFiles("./Bottleneko.ScriptAPI/src/typeDefs", "./Bottleneko.ScriptAPI/dist", "*.d.ts", recursive: true);
        CopyFiles("./Bottleneko.ScriptAPI/dist", "./Bottleneko.Core/Scripting/Js/API", "*.js", recursive: true);
        CopyFiles("./Bottleneko.ScriptAPI/dist", "./Bottleneko.Client/src/lib/scriptApi", "*.ts", recursive: true, exclude: file => Path.GetFileName(file).StartsWith('_'));
    });

    Step("Generating typeDefs.ts", () =>
    {
        var files = Directory.GetFiles("./Bottleneko.Client/src/lib/scriptApi", "*.d.ts", new EnumerationOptions() { RecurseSubdirectories = true });
        var imports = files.Select((file, idx) =>
        {
            var relativePath = Path.GetRelativePath("./Bottleneko.Client/src/lib/scriptApi", Path.Join(Path.GetDirectoryName(file), Path.GetFileNameWithoutExtension(file))).Replace('\\', '/');
            return $"import typeDef{idx} from './{relativePath}?raw';";
        });
        var exports = files.Select((file, idx) =>
        {
            var relativePath = Path.GetRelativePath("./Bottleneko.Client/src/lib/scriptApi", file).Replace('\\', '/');
            return $"    {{ src: typeDef{idx}, path: '{relativePath}' }},";
        });

        var sb = new StringBuilder();
        foreach (var line in imports)
        {
            sb.AppendLine(line);
        }
        sb.AppendLine();
        sb.AppendLine("export default [");
        foreach (var line in exports)
        {
            sb.AppendLine(line);
        }
        sb.AppendLine("];");

        File.WriteAllText("./Bottleneko.Client/src/lib/scriptApi/typeDefs.ts", sb.ToString());
    });
});
