using System.Diagnostics.CodeAnalysis;
using System.Numerics;
using Telegram.Bot.Types;

namespace Bottleneko.Scripting.Bindings.Telegram;

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class TelegramChatterBinding : RawChatterBinding
{
    internal TelegramChatterBinding(User user)
    {
        User = user;
    }

    public BigInteger id => User.Id;
    public string firstName => User.FirstName;
    public string? lastName => User.LastName;
    public string? username => User.Username;
    public string? languageCode => User.LanguageCode;
    public bool isPremium => User.IsPremium;
    public bool addedToAttachmentMenu => User.AddedToAttachmentMenu;

    internal User User { get; }
}
