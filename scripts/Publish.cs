#!/usr/bin/dotnet run
#:project ../Bottleneko.CliHelpers/Bottleneko.CliHelpers.csproj

using static Bottleneko.CliHelpers.Helpers;

string[] platforms = ["win-x64", "win-arm64", "osx-x64", "osx-arm64", "linux-x64", "linux-arm64"];

Step("Cleaning up files from previous runs", () =>
{
    Delete("./publish", recursive: true);
});

Run("npm", ["run", "build", "--", "--outDir", "../publish/wwwroot", "--emptyOutDir"], workingDir: "./Bottleneko.Client", "Building Bottleneko.Client");

foreach (var platform in platforms)
{
    Step($"Platform {platform}", () =>
    {
        Run("dotnet", ["publish", "./Bottleneko.Server", "-c", "Release", "-r", platform, "--self-contained", "-o", $"./publish/{platform}"], description: $"Building Bottleneko.Server");
        Directory.CreateDirectory($"./publish/{platform}/wwwroot");
        Step($"Copying Bottleneko.Client files", () =>
        {
            CopyFiles("./publish/wwwroot", $"./publish/{platform}/wwwroot", "*", recursive: true);
        });
    });
}

Step("Cleaning up", () =>
{
    Delete("./publish/wwwroot", recursive: true);
});
