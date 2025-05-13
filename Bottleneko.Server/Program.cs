using Bottleneko.Server;
using Spectre.Console.Cli;
using System.ComponentModel;

var app = new CommandApp<DefaultCommand>();
return app.Run(args);

class DefaultCommand : AsyncCommand<DefaultCommand.Settings>
{
    public class Settings : CommandSettings
    {
        [Description("Path to the database file (a new file will be created if it doesn't exist)")]
        [CommandOption("--db")]
        [DefaultValue("bottleneko.db")]
        public required string DatabaseFile { get; init; }

        [Description("Comma-separated list of URLs to listen to (e.g., http://localhost:5000)")]
        [CommandOption("-b|--bind")]
        [DefaultValue(null)]
        public required string? BindAddresses { get; init; }
    }

    public override async Task<int> ExecuteAsync(CommandContext context, Settings settings)
    {
        await using var server = new BottlenekoServer();
        return await server.StartAsync(settings.DatabaseFile, string.IsNullOrWhiteSpace(settings.BindAddresses) ? [] : settings.BindAddresses.Split(","));
    }
}
