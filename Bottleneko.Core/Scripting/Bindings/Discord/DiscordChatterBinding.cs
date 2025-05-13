using Discord;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Bindings.Discord;

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class DiscordChatterBinding : RawChatterBinding
{
    internal DiscordChatterBinding(IUser user)
    {
        id = user.Id;
        username = user.Username;
        discriminator = user.Discriminator == "0000" ? null : user.Discriminator;
        globalName = user.GlobalName;
        localName = user is IGuildUser guildUser ? guildUser.DisplayName : user.GlobalName;

        User = user;
    }

    public BigInteger id { get; }
    public string username { get; }
    public string? discriminator { get; }
    public string globalName { get; }
    public string localName { get; }

    internal IUser User { get; } = null!;
}
