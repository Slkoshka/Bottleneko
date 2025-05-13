using Discord;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Bindings.Discord;

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class DiscordChatMessageAttachmentBinding : RawChatMessageAttachmentBinding
{
    internal DiscordChatMessageAttachmentBinding(Attachment attachment)
    {
        Attachment = attachment;
    }

    public BigInteger id => Attachment.Id;
    public string? title => Attachment.Title;
    public string? description => Attachment.Description;
    public string url => Attachment.Url;
    public string proxyUrl => Attachment.ProxyUrl;

    internal Attachment Attachment { get; }
}
