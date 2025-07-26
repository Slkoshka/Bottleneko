using Akka.Actor;

namespace Bottleneko.Scripting.Bindings.Twitch;

[ExposeToScripts]

public class TwitchConnectionBinding(long connectionId, IActorRef connection) : RawConnectionBinding(connectionId, connection)
{
}
