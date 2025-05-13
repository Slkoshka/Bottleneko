using Bottleneko.Scripting.Bindings.Discord;
using Bottleneko.Scripting.Bindings.Telegram;
using Microsoft.ClearScript;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Bindings;

[ExposeToScripts(typeof(DiscordChatMessageAttachmentBinding), typeof(TelegramChatMessageAttachmentBinding))]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
[SuppressMessage("Performance", "CA1822:Mark members as static")]
public abstract class RawChatMessageAttachmentBinding
{
    public DiscordChatMessageAttachmentBinding? asDiscord() => this as DiscordChatMessageAttachmentBinding;
    public TelegramChatMessageAttachmentBinding? asTelegram() => this as TelegramChatMessageAttachmentBinding;
    public object? asTwitch() => null;
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class ChatMessageAttachmentBinding
{
    public required BigInteger id { get; init; }
    public required BigInteger messageId { get; init; }
    public required string contentType { get; init; }
    public required string? fileName { get; init; }

    [ScriptMember(ScriptMemberFlags.ExposeRuntimeType)]
    public required RawChatMessageAttachmentBinding raw { get; init; }
}
