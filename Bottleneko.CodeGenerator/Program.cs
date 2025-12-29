using Spectre.Console.Cli;
using System.ComponentModel;

namespace Bottleneko.CodeGenerator;

class Program
{
    class DefaultCommand : Command<DefaultCommand.Settings>
    {
        public class Settings : CommandSettings
        {
            [Description("API bindings output location")]
            [CommandArgument(0, "<api>")]
            public required string API { get; init; }

            [Description("Script bindings output location")]
            [CommandArgument(1, "<script>")]
            public required string Bindings { get; init; }
        }

        public override int Execute(CommandContext context, Settings settings)
        {
            Console.WriteLine("Bottleneko Code Generator");
            Console.WriteLine();

            Console.WriteLine(" [*] Generating API bindings...");
            Generator.GenerateAPI(settings.API);
            Console.WriteLine($"     [*] Written to {Path.GetFullPath(settings.API)}");

            Console.WriteLine(" [*] Generating script bindings...");
            Generator.GenerateScriptBindings(settings.Bindings);
            Console.WriteLine($"     [*] Written to {Path.GetFullPath(settings.Bindings)}");

            return 0;
        }
    }

    public static int Main(string[] args)
    {
        var app = new CommandApp<DefaultCommand>();
        return app.Run(args);
    }
}
