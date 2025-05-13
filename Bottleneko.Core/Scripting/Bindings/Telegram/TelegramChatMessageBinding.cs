using Telegram.Bot.Types;

namespace Bottleneko.Scripting.Bindings.Telegram;

[ExposeToScripts]
public class TelegramChatMessageBinding : RawChatMessageBinding
{
    internal TelegramChatMessageBinding(Update update)
    {
        Update = update;
    }

    internal Update Update { get; }
}
