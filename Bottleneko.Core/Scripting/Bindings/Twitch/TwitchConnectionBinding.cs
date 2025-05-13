using Akka.Actor;

namespace Bottleneko.Scripting.Bindings.Twitch;

[ExposeToScripts]
#pragma warning disable CS9113 // Parameter is unread.
public class TwitchConnectionBinding(long connectionId, IActorRef connection) : RawConnectionBinding
#pragma warning restore CS9113 // Parameter is unread.
{
}
