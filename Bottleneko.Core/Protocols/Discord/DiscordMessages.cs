using Bottleneko.Messages;

namespace Bottleneko.Protocols.Discord;

public static class DiscordMessages
{
    public record GetChat(ulong ChatId) : IHandledByConnection;
}
