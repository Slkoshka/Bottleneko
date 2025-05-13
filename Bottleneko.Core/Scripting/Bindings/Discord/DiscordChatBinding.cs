using Bottleneko.Utils;
using Discord;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Bindings.Discord;

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class DiscordGuildBinding
{
    internal DiscordGuildBinding(IGuild guild)
    {
        Guild = guild;
    }

    public BigInteger id => Guild.Id;
    public string name => Guild.Name;
    public string? description => Guild.Description;
    public BigInteger ownerId => Guild.OwnerId;

    internal IGuild Guild { get; }
}

[ExposeToScripts]
public enum DiscordChannelType
{
    Text = ChannelType.Text,
    DM = ChannelType.DM,
    Voice = ChannelType.Voice,
    Group = ChannelType.Group,
    Category = ChannelType.Category,
    News = ChannelType.News,
    Store = ChannelType.Store,
    NewsThread = ChannelType.NewsThread,
    PublicThread = ChannelType.PublicThread,
    PrivateThread = ChannelType.PrivateThread,
    Stage = ChannelType.Stage,
    GuildDirectory = ChannelType.GuildDirectory,
    Forum = ChannelType.Forum,
    Media = ChannelType.Media,
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class DiscordChannelBinding
{
    static DiscordChannelBinding()
    {
        if (!EnumUtils.IsSameEnum<DiscordChannelType, ChannelType>())
        {
            throw new Exception($"{typeof(DiscordChannelType).FullName} enum does not match {typeof(ChannelType).FullName} enum");
        }
    }

    internal DiscordChannelBinding(IChannel channel)
    {
        Channel = channel;
    }

    public BigInteger id => Channel.Id;
    public string name => Channel.Name;
    public DiscordChannelType type => (DiscordChannelType)Channel.ChannelType;

    internal IChannel Channel { get; }
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class DiscordChatBinding : RawChatBinding
{
    internal DiscordChatBinding(IChannel discordChannel)
    {
        guild = discordChannel is IGuildChannel guildChannel ? new DiscordGuildBinding(guildChannel.Guild) : null;
        channel = new DiscordChannelBinding(discordChannel);
    }

    public DiscordGuildBinding? guild { get; }
    public DiscordChannelBinding channel { get; }
}
