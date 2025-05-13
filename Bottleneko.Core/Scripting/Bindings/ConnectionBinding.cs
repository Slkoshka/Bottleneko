using Bottleneko.Api.Dtos;
using Bottleneko.Scripting.Bindings.Discord;
using Bottleneko.Scripting.Bindings.Telegram;
using Bottleneko.Scripting.Bindings.Twitch;
using Microsoft.ClearScript;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Bindings;

[ExposeToScripts(typeof(DiscordConnectionBinding), typeof(TelegramConnectionBinding), typeof(TwitchConnectionBinding))]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public abstract class RawConnectionBinding
{
    // Classes implementing this abstract class must also have (long connectionId, IActorRef connection) constructor

    public DiscordConnectionBinding? asDiscord() => this as DiscordConnectionBinding;
    public TelegramConnectionBinding? asTwelegram() => this as TelegramConnectionBinding;
    public TwitchConnectionBinding? asTwitch() => this as TwitchConnectionBinding;
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class ConnectionBinding
{
    public required BigInteger id { get; init; }
    public required Protocol protocol { get; init; }
    public required string name { get; init; }
    public required ConnectionStatus status { get; init; }

    [ScriptMember(ScriptMemberFlags.ExposeRuntimeType)]
    public required RawConnectionBinding? raw { get; init; }
}
