#!/usr/bin/dotnet run
#:project ../Bottleneko.CliHelpers/Bottleneko.CliHelpers.csproj
#:package System.CommandLine@2.*-*
#:property PublishAot=false

using System.CommandLine;
using System.IO.Compression;
using System.Net.Http.Json;
using System.Runtime.InteropServices;
using System.Text.Json.Serialization;
using static Bottleneko.CliHelpers.Helpers;

var platformOption = new Option<string>("--platform")
{
    Description = "Target platform (all, current, osx-arm64, osx-x64, linux-arm64, linux-x64, win-x64)",
    DefaultValueFactory = _ => "all",
};
var versionSuffixOption = new Option<string>("--tag")
{
    Description = "Version tag",
    DefaultValueFactory = _ => "local",
};
var outputOption = new Option<string>("--output")
{
    Description = "Output directory",
    DefaultValueFactory = _ => "./publish",
};

var rootCommand = new RootCommand("Bottleneko release build script")
{
    Options =
    {
        platformOption,
        versionSuffixOption,
        outputOption,
    },
};

rootCommand.SetAction(async parseResult =>
{
    var targetPlatform = parseResult.GetValue(platformOption)!;
    var versionSuffix = parseResult.GetValue(versionSuffixOption)!;
    var output = parseResult.GetValue(outputOption)!;

    using var http = new HttpClient()
    {
        DefaultRequestHeaders =
        {
            UserAgent =
            {
                new("Bottleneko", "1.0"),
            },
        },
    };

    var platforms = new (string Id, string DenoAssetName, string DenoFilename, Func<bool> Check)[]
    {
        ("osx-arm64", "deno-aarch64-apple-darwin.zip", "deno", () => OperatingSystem.IsMacOS() && RuntimeInformation.ProcessArchitecture == Architecture.Arm64),
        ("osx-x64", "deno-x86_64-apple-darwin.zip", "deno", () => OperatingSystem.IsMacOS() && RuntimeInformation.ProcessArchitecture == Architecture.X64),
        ("linux-arm64", "deno-aarch64-unknown-linux-gnu.zip", "deno", () => OperatingSystem.IsLinux() && RuntimeInformation.ProcessArchitecture == Architecture.Arm64),
        ("linux-x64", "deno-x86_64-unknown-linux-gnu.zip", "deno", () => OperatingSystem.IsLinux() && RuntimeInformation.ProcessArchitecture == Architecture.X64),
        ("win-x64", "deno-x86_64-pc-windows-msvc.zip", "deno.exe", () => OperatingSystem.IsWindows() && RuntimeInformation.ProcessArchitecture == Architecture.X64),
    };

    Step("Checking prerequisites", () =>
    {
        if (!File.Exists("Bottleneko.slnx"))
        {
            throw new Exception("This script must be run from the root directory of the project");
        }
    });

    Step("Cleaning up files from previous runs", () =>
    {
        Delete(output, recursive: true);
        Delete("./Bottleneko.Client/build", recursive: true);
    });

    Step("Bottleneko.Client", () =>
    {
        Directory.CreateDirectory(output);
        Run("npm", ["install"], workingDir: "./Bottleneko.Client", "Installing dependencies");
        Run("npm", ["run", "build"], workingDir: "./Bottleneko.Client", "Building Bottleneko.Client");
    });

    foreach (var platform in platforms.Where(platform => targetPlatform == "all" || (targetPlatform == "current" && platform.Check()) || targetPlatform == platform.Id))
    {
        await Step($"Platform {platform.Id}", async () =>
        {
            var platformOutput = targetPlatform == "all" ? Path.Combine(output, platform.Id) : output;

            Directory.CreateDirectory(platformOutput);
            Run("dotnet", ["publish", "./Bottleneko.Server", "-c", "Release", "-r", platform.Id, $"/p:VersionSuffix={versionSuffix}", "/p:WarningLevel=0", "--self-contained", "-o", platformOutput], description: $"Building Bottleneko.Server");

            Directory.CreateDirectory(Path.Combine(platformOutput, "wwwroot"));
            Step($"Copying Bottleneko.Client files", () =>
            {
                CopyFiles("./Bottleneko.Client/build", Path.Combine(platformOutput, "wwwroot"), "*", recursive: true);
            });

            await Step("Getting Deno", async() =>
            {
                var url = await Step("Checking latest Deno version on GitHub", async () =>
                {
                    return (await http.GetFromJsonAsync<GitHubRelease>("https://api.github.com/repos/denoland/deno/releases/latest") ?? throw new Exception("Empty response")).Assets.Single(asset => asset.Name == platform.DenoAssetName).BrowserDownloadUrl;
                });

                await Step("Downloading Deno runtime", async () =>
                {
                    using var stream = await http.GetStreamAsync(url);
                    using var archive = new ZipArchive(stream);
                    await (archive.GetEntry(platform.DenoFilename) ?? throw new Exception("Can't find Deno binary")).ExtractToFileAsync(Path.Combine(platformOutput, "deno"));
                });
            });
        });
    }
});

await rootCommand.Parse(args).InvokeAsync();

record GitHubAsset([property: JsonPropertyName("name")] string Name, [property: JsonPropertyName("browser_download_url")] string BrowserDownloadUrl);
record GitHubRelease([property: JsonPropertyName("assets")] GitHubAsset[] Assets);
