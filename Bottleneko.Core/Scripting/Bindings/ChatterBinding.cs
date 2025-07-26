using Bottleneko.Api.Dtos;
using Bottleneko.Scripting.Bindings.Discord;
using Bottleneko.Scripting.Bindings.Telegram;
using Bottleneko.Scripting.Bindings.Twitch;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Bindings;

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class ChatterFlags
{
    public required bool isBot { get; init; }
}

[ExposeToScripts(typeof(DiscordChatterBinding), typeof(TelegramChatterBinding), typeof(TwitchChatterBinding))]
public abstract class RawChatterBinding
{
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class ChatterBinding(RawChatterBinding raw)
{
    public required BigInteger id { get; init; }
    public required Protocol protocol { get; init; }
    public required BigInteger connectionId { get; init; }
    public required string displayName { get; init; }
    public required string username { get; init; }
    public required ChatterFlags flags { get; init; }

    public DiscordChatterBinding? discord => raw as DiscordChatterBinding;
    public TelegramChatterBinding? telegram => raw as TelegramChatterBinding;
    public TwitchChatterBinding? twitch => raw as TwitchChatterBinding;
}
