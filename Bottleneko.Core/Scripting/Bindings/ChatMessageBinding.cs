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
public class ChatMessageFlags
{
    public required bool isSpecial { get; init; }
    public required bool isDirect { get; init; }
    public required bool isOffline { get; init; }
}

[ExposeToScripts(typeof(DiscordChatMessageBinding), typeof(TelegramChatMessageBinding), typeof(TwitchChatMessageBinding))]
public abstract class RawChatMessageBinding
{
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class ChatMessageBinding(IActorRef connection, RawChatMessageBinding raw)
{
    public required BigInteger id { get; init; }
    public required Protocol protocol { get; init; }
    public required BigInteger connectionId { get; init; }
    public required DateTime timestamp { get; init; }
    public required ChatMessageAttachmentBinding[] attachments { get; init; }
    public required ChatBinding chat { get; init; }
    public required ChatterBinding author { get; init; }
    public required string? text { get; init; }
    public required BigInteger? replyToId { get; init; }
    public required ChatMessageFlags flags { get; init; }

    public DiscordChatMessageBinding? discord => raw as DiscordChatMessageBinding;
    public TelegramChatMessageBinding? telegram => raw as TelegramChatMessageBinding;
    public TwitchChatMessageBinding? twitch => raw as TwitchChatMessageBinding;

    public void reply(string text)
    {
        connection.Tell(new IConnectionsMessage.SimpleReply((long)connectionId, this, text));
    }
}
