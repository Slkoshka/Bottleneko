using Discord;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Bindings.Discord;

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class DiscordChatMessageBinding : RawChatMessageBinding
{
    internal DiscordChatMessageBinding(IMessage message)
    {
        id = message.Id;
        isPinned = message.IsPinned;
        isEveryoneMentioned = message.MentionedEveryone;
        channelMentions = [.. message.MentionedChannelIds];
        roleMentions = [.. message.MentionedRoleIds];
        userMentions = [.. message.MentionedUserIds];

        Message = message;
    }

    public BigInteger id { get; }
    public bool isPinned { get; }
    public bool isEveryoneMentioned { get; }
    public BigInteger[] channelMentions { get; }
    public BigInteger[] roleMentions { get; }
    public BigInteger[] userMentions { get; }

    internal IMessage Message { get; } = null!;
}
