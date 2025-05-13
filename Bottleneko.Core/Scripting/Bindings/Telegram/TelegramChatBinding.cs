using Bottleneko.Utils;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace Bottleneko.Scripting.Bindings.Telegram;

[ExposeToScripts]
public enum TelegramChatType
{
    Private = ChatType.Private,
    Group = ChatType.Group,
    Channel = ChatType.Channel,
    Supergroup = ChatType.Supergroup,
    Sender = ChatType.Sender,
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class TelegramChatBinding : RawChatBinding
{
    static TelegramChatBinding()
    {
        if (!EnumUtils.IsSameEnum<TelegramChatType, ChatType>())
        {
            throw new Exception($"{typeof(TelegramChatType).FullName} enum does not match {typeof(ChatType).FullName} enum");
        }
    }

    internal TelegramChatBinding(Chat chat)
    {
        Chat = chat;
    }

    public BigInteger id => Chat.Id;
    public TelegramChatType type => (TelegramChatType)Chat.Type;
    public string? title => Chat.Title;
    public string? firstName => Chat.FirstName;
    public string? lastName => Chat.LastName;
    public bool isForum => Chat.IsForum;

    internal Chat Chat { get; }
}
