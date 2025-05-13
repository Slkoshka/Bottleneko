using Bottleneko.Messages;

namespace Bottleneko.Protocols.Discord;

public interface IDiscordMessage : IConnectionsMessage
{
    public record GetChat(long ConnectionId, ulong ChatId) : ContainerItemMessage(ConnectionId), IDiscordMessage, IHasReply;
}
