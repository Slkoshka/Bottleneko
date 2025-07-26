using Akka.Actor;

namespace Bottleneko.Scripting.Bindings.Telegram;

[ExposeToScripts]
public class TelegramConnectionBinding(long connectionId, IActorRef connection) : RawConnectionBinding(connectionId, connection)
{
}
