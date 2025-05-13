using Akka.Actor;

namespace Bottleneko.Scripting.Bindings.Telegram;

[ExposeToScripts]
#pragma warning disable CS9113 // Parameter is unread.
public class TelegramConnectionBinding(long connectionId, IActorRef connection) : RawConnectionBinding
#pragma warning restore CS9113 // Parameter is unread.
{
}
