using Akka.Actor;
using Bottleneko.Api.Dtos;
using Bottleneko.Messages;
using Bottleneko.Scripting.Bindings.Discord;
using Bottleneko.Scripting.Bindings.Telegram;
using Bottleneko.Scripting.Bindings.Twitch;
using Microsoft.ClearScript;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Bindings;

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class ChatFlags
{
    public required bool isPrivate { get; init; }
}

[ExposeToScripts(typeof(DiscordChatBinding), typeof(TelegramChatBinding), typeof(TwitchChatBinding))]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public abstract class RawChatBinding
{
    public DiscordChatBinding? asDiscord() => this as DiscordChatBinding;
    public TelegramChatBinding? asTelegram() => this as TelegramChatBinding;
    public TwitchChatBinding? asTwitch() => this as TwitchChatBinding;
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class ChatBinding(IActorRef connection)
{
    public required BigInteger id { get; init; }
    public required Protocol protocol { get; init; }
    public required BigInteger connectionId { get; init; }
    public required string displayName { get; init; }
    public required ChatFlags flags { get; init; }

    [ScriptMember(ScriptMemberFlags.ExposeRuntimeType)]
    public required RawChatBinding raw { get; init; }

    public void sendMessage(string text)
    {
        connection.Tell(new IConnectionsMessage.SendMessage((long)connectionId, this, text));
    }
}
