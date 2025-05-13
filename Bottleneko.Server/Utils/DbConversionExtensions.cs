using Bottleneko.Api.Dtos;
using Bottleneko.Database.Schema;

namespace Bottleneko.Server.Utils;

public static class DbConversionExtensions
{
    public static UserDto ToDto(this UserEntity user)
    {
        return new UserDto(
            user.Id.ToString(),
            user.Login,
            user.DisplayName
        );
    }

    public static ChatMessageDto ToDto(this ChatMessageEntity msg)
    {
        return new ChatMessageDto(
            msg.Id.ToString(),
            msg.ConnectionId.ToString(),
            DateTime.SpecifyKind(msg.RemoteTimestamp, DateTimeKind.Utc),
            new ChatSummaryDto(msg.Chat.Id.ToString(), msg.Chat.DisplayName),
            new ChatterSummaryDto(msg.Author.Id.ToString(), msg.Author.DisplayName),
            msg.TextContent,
            [.. msg.Attachments.Select(attachment => new AttachmentDto(attachment.Id.ToString(), attachment.FileName, attachment.ContentType))],
            msg.IsSpecial,
            msg.IsDirect,
            msg.IsOffline
        );
    }

    public static ConnectionDto ToDto(this ConnectionEntity connection, ConnectionStatus status)
    {
        return new ConnectionDto(
            connection.Id.ToString(),
            connection.Name,
            connection.Protocol,
            connection.AutoStart,
            connection.Configuration,
            status
        );
    }

    public static ScriptDto ToDto(this ScriptEntity script, ScriptStatus status)
    {
        return new ScriptDto(
            script.Id.ToString(),
            script.Name,
            script.Description,
            script.AutoStart,
            script.Code,
            status
        );
    }
}
