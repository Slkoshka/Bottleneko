using Bottleneko.Scripting.Bindings.Discord;
using Bottleneko.Scripting.Bindings.Telegram;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Bindings;

[ExposeToScripts(typeof(DiscordChatMessageAttachmentBinding), typeof(TelegramChatMessageAttachmentBinding))]
public abstract class RawChatMessageAttachmentBinding
{
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class ChatMessageAttachmentBinding(RawChatMessageAttachmentBinding raw)
{
    public required BigInteger id { get; init; }
    public required BigInteger messageId { get; init; }
    public required string contentType { get; init; }
    public required string? fileName { get; init; }

    public DiscordChatMessageAttachmentBinding? discord => raw as DiscordChatMessageAttachmentBinding;
    public TelegramChatMessageAttachmentBinding? telegram => raw as TelegramChatMessageAttachmentBinding;
#pragma warning disable CA1822 // Mark members as static
    public object? twitch => null;
#pragma warning restore CA1822 // Mark members as static
}
