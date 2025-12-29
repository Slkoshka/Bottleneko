using Akka.Actor;
using Bottleneko.Api.Dtos;
using Bottleneko.Messages;
using Bottleneko.Scripting.Bindings.Discord;
using Bottleneko.Scripting.Bindings.Telegram;
using Bottleneko.Scripting.Bindings.Twitch;
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
public abstract class RawChatBinding
{
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class ChatBinding(IActorRef connection, RawChatBinding raw)
{
    public required BigInteger id { get; init; }
    public required Protocol protocol { get; init; }
    public required BigInteger connectionId { get; init; }
    public required string displayName { get; init; }
    public required ChatFlags flags { get; init; }

    public DiscordChatBinding? discord => raw as DiscordChatBinding;
    public TelegramChatBinding? telegram => raw as TelegramChatBinding;
    public TwitchChatBinding? twitch => raw as TwitchChatBinding;

    public void sendMessage(string text)
    {
        connection.Tell(new ConnectionMessages.SendMessage(this, text));
    }
}
