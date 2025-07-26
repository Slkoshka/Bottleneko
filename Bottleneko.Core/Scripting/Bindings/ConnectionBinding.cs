using Akka.Actor;
using Bottleneko.Api.Dtos;
using Bottleneko.Scripting.Bindings.Discord;
using Bottleneko.Scripting.Bindings.Telegram;
using Bottleneko.Scripting.Bindings.Twitch;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;

namespace Bottleneko.Scripting.Bindings;

[ExposeToScripts(typeof(DiscordConnectionBinding), typeof(TelegramConnectionBinding), typeof(TwitchConnectionBinding))]
public abstract class RawConnectionBinding(long connectionId, IActorRef connection)
{
    protected long ConnectionId { get; } = connectionId;
    protected IActorRef Connection { get; } = connection;
}

[ExposeToScripts]
[SuppressMessage("Style", "IDE1006:Naming Styles")]
public class ConnectionBinding(RawConnectionBinding raw)
{
    public required BigInteger id { get; init; }
    public required Protocol protocol { get; init; }
    public required string name { get; init; }
    public required ConnectionStatus status { get; init; }

    public DiscordConnectionBinding? discord => raw as DiscordConnectionBinding;
    public TelegramConnectionBinding? telegram => raw as TelegramConnectionBinding;
    public TwitchConnectionBinding? twitch => raw as TwitchConnectionBinding;
}
