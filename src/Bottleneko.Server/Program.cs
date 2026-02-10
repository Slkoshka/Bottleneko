using Bottleneko.Server;
using Spectre.Console.Cli;
using System.ComponentModel;

var app = new CommandApp<DefaultCommand>();
return app.Run(args);

class DefaultCommand : AsyncCommand<DefaultCommand.Settings>
{
    public class Settings : CommandSettings
    {
        [Description("Override data storage path (a new directory will be created if it doesn't exist)")]
        [CommandOption("--data")]
        public string? DataPath { get; init; }

        [Description("Comma-separated list of URLs to listen to (e.g., http://localhost:5000)")]
        [CommandOption("-b|--bind")]
        [DefaultValue(null)]
        public required string? BindAddresses { get; init; }
    }

    public override async Task<int> ExecuteAsync(CommandContext context, Settings settings)
    {
        await using var server = new BottlenekoServer();
        return await server.StartAsync(settings.DataPath, string.IsNullOrWhiteSpace(settings.BindAddresses) ? [] : settings.BindAddresses.Split(","));
    }
}
