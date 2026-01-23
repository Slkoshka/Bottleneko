#!/usr/bin/dotnet run
#:project ../Bottleneko.CliHelpers/Bottleneko.CliHelpers.csproj
#:property PublishAot=false

using static Bottleneko.CliHelpers.Helpers;

string[] platforms = ["win-x64", "win-arm64", "osx-x64", "osx-arm64", "linux-x64", "linux-arm64"];

Step("Checking prerequisites", () =>
{
    if (!File.Exists("Bottleneko.slnx"))
    {
        throw new Exception("This script must be run from the root directory of the project");
    }
});

Step("Cleaning up files from previous runs", () =>
{
    Delete("./publish", recursive: true);
    Delete("./Bottleneko.Client/build", recursive: true);
});

Step("Bottleneko.Client", () =>
{
    Directory.CreateDirectory($"./publish");
    Run("npm", ["install"], workingDir: "./Bottleneko.Client", "Installing dependencies");
    Run("npm", ["run", "build"], workingDir: "./Bottleneko.Client", "Building Bottleneko.Client");
});

foreach (var platform in platforms)
{
    Step($"Platform {platform}", () =>
    {
        Directory.CreateDirectory($"./publish/{platform}");
        Run("dotnet", ["publish", "./Bottleneko.Server", "-c", "Release", "-r", platform, "--self-contained", "-o", $"./publish/{platform}"], description: $"Building Bottleneko.Server");

        Directory.CreateDirectory($"./publish/{platform}/wwwroot");
        Step($"Copying Bottleneko.Client files", () =>
        {
            CopyFiles("./Bottleneko.Client/build", $"./publish/{platform}/wwwroot", "*", recursive: true);
        });
    });
}
