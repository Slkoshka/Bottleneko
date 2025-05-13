using Bottleneko.Api.Dtos;
using Bottleneko.Scripting.Bindings.Discord;
using Bottleneko.Scripting.Bindings.Telegram;
using Bottleneko.Scripting.Bindings.Twitch;
using Microsoft.ClearScript;
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
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public abstract class RawChatterBinding
{
    public DiscordChatterBinding? asDiscord() => this as DiscordChatterBinding;
    public TelegramChatterBinding? asTelegram() => this as TelegramChatterBinding;
    public TwitchChatterBinding? asTwitch() => this as TwitchChatterBinding;
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class ChatterBinding
{
    public required BigInteger id { get; init; }
    public required Protocol protocol { get; init; }
    public required BigInteger connectionId { get; init; }
    public required string displayName { get; init; }
    public required string username { get; init; }
    public required ChatterFlags flags { get; init; }

    [ScriptMember(ScriptMemberFlags.ExposeRuntimeType)]
    public required RawChatterBinding raw { get; init; }
}
