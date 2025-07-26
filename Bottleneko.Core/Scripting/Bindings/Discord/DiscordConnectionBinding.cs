using Akka.Actor;
using Bottleneko.Protocols.Discord;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Bindings.Discord;

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
[SuppressMessage("Style", "VSTHRD200:Use \"Async\" suffix for async methods")]
public class DiscordConnectionBinding(long connectionId, IActorRef connection) : RawConnectionBinding(connectionId, connection)
{
    public Task<ChatBinding?> getChat(BigInteger id)
    {
        return Connection.Ask<ChatBinding?>(new IDiscordMessage.GetChat(ConnectionId, (ulong)id));
    }
}
