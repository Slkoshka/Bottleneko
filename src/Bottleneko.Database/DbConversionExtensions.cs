using Bottleneko.Api.Dtos;
using Bottleneko.Database.Schema;

namespace Bottleneko.Database;

public static class DbConversionExtensions
{
    public static UserDto ToDto(this UserEntity user)
    {
        return new UserDto(
            user.Id,
            user.Login,
            user.DisplayName
        );
    }

    public static ChatMessageDto ToDto(this ChatMessageEntity msg)
    {
        switch (msg)
        {
            case { Discord: { } discord }:
                return new DiscordChatMessageDto()
                {
                    Id = msg.Id,
                    ConnectionId = msg.ConnectionId,
                    Timestamp = DateTime.SpecifyKind(msg.RemoteTimestamp, DateTimeKind.Utc),
                    Chat = new ChatSummaryDto(msg.Chat.Id, msg.Chat.DisplayName),
                    Author = new ChatterSummaryDto
                    {
                        Id = msg.Author.Id,
                        DisplayName = msg.Author.DisplayName,
                        Username = msg.Author.Username,
                        IsBot = msg.Author.IsBot,
                    },
                    CustomAuthorName = msg.CustomAuthorName,
                    TextContent = msg.TextContent,
                    Attachments = [.. msg.Attachments.Select(attachment => new DiscordAttachmentDto
                    {
                        Id = attachment.Id,
                        Name = attachment.FileName,
                        ContentType = attachment.ContentType,

                        DiscordId = attachment.Discord!.DiscordAttachmentId,
                        Title = attachment.Discord!.Title,
                        Description = attachment.Discord!.Description,
                        Url = attachment.Discord!.Url,
                        ProxyUrl = attachment.Discord!.ProxyUrl,
                    })],
                    IsSpecial = msg.IsSpecial,
                    IsDirect = msg.IsDirect,
                    IsMissed = msg.IsOffline,

                    DiscordId = discord.DiscordMessageId,
                    IsPinned = discord.IsPinned,
                    IsEveryoneMentioned = discord.IsEveryoneMentioned,
                    ChannelMentions = discord.ChannelMentions,
                    RoleMentions = discord.RoleMentions,
                    UserMentions = discord.RoleMentions,
                };

            case { Telegram: { } telegram }:
                return new TelegramChatMessageDto()
                {
                    Id = msg.Id,
                    ConnectionId = msg.ConnectionId,
                    Timestamp = DateTime.SpecifyKind(msg.RemoteTimestamp, DateTimeKind.Utc),
                    Chat = new ChatSummaryDto(msg.Chat.Id, msg.Chat.DisplayName),
                    Author = new ChatterSummaryDto
                    {
                        Id = msg.Author.Id,
                        DisplayName = msg.Author.DisplayName,
                        Username = msg.Author.Username,
                        IsBot = msg.Author.IsBot,
                    },
                    CustomAuthorName = msg.CustomAuthorName,
                    TextContent = msg.TextContent,
                    Attachments = [.. msg.Attachments.Select(attachment => new TelegramAttachmentDto
                    {
                        Id = attachment.Id,
                        Name = attachment.FileName,
                        ContentType = attachment.ContentType,
                    })],
                    IsSpecial = msg.IsSpecial,
                    IsDirect = msg.IsDirect,
                    IsMissed = msg.IsOffline,
                };
            
            case { Twitch: { IsWhisper: true } twitch }:
                return new WhisperTwitchChatMessageDto()
                {
                    Id = msg.Id,
                    ConnectionId = msg.ConnectionId,
                    Timestamp = DateTime.SpecifyKind(msg.RemoteTimestamp, DateTimeKind.Utc),
                    Chat = new ChatSummaryDto(msg.Chat.Id, msg.Chat.DisplayName),
                    Author = new ChatterSummaryDto
                    {
                        Id = msg.Author.Id,
                        DisplayName = msg.Author.DisplayName,
                        Username = msg.Author.Username,
                        IsBot = msg.Author.IsBot,
                    },
                    CustomAuthorName = msg.CustomAuthorName,
                    TextContent = msg.TextContent,
                    Attachments = [.. msg.Attachments.Select(attachment => new TwitchAttachmentDto
                    {
                        Id = attachment.Id,
                        Name = attachment.FileName,
                        ContentType = attachment.ContentType,
                    })],
                    IsSpecial = msg.IsSpecial,
                    IsDirect = msg.IsDirect,
                    IsMissed = msg.IsOffline,

                    TwitchId = twitch.TwitchId,
                };

            case { Twitch: { IsWhisper: false } twitch }:
                return new ChannelTwitchChatMessageDto()
                {
                    Id = msg.Id,
                    ConnectionId = msg.ConnectionId,
                    Timestamp = DateTime.SpecifyKind(msg.RemoteTimestamp, DateTimeKind.Utc),
                    Chat = new ChatSummaryDto(msg.Chat.Id, msg.Chat.DisplayName),
                    Author = new ChatterSummaryDto
                    {
                        Id = msg.Author.Id,
                        DisplayName = msg.Author.DisplayName,
                        Username = msg.Author.Username,
                        IsBot = msg.Author.IsBot,
                    },
                    CustomAuthorName = msg.CustomAuthorName,
                    TextContent = msg.TextContent,
                    Attachments = [.. msg.Attachments.Select(attachment => new TwitchAttachmentDto
                    {
                        Id = attachment.Id,
                        Name = attachment.FileName,
                        ContentType = attachment.ContentType,
                    })],
                    IsSpecial = msg.IsSpecial,
                    IsDirect = msg.IsDirect,
                    IsMissed = msg.IsOffline,

                    TwitchId = twitch.TwitchId,
                    Badges = [.. twitch.Badges.Select(badge => new TwitchChatBadge(badge.TwitchId, badge.Info, badge.TwitchSetId))],
                    Color = twitch.Color!,
                    CheerBits = twitch.CheerBits,
                    ChannelPointsCustomRewardId = twitch.ChannelPointsCustomRewardId,
                    IsSubscriber = twitch.IsSubscriber!.Value,
                    IsModerator = twitch.IsModerator!.Value,
                    IsBroadcaster = twitch.IsBroadcaster!.Value,
                    IsVip = twitch.IsVip!.Value,
                    IsStaff = twitch.IsStaff!.Value,
                };

            default:
                throw new NotImplementedException();
        }
    }

    public static ChatterDto ToDto(this ChatterEntity chatter)
    {
        switch (chatter)
        {
            case { Discord: { } discord }:
                return new DiscordChatterDto()
                {
                    Id = chatter.Id,
                    DisplayName = chatter.DisplayName,
                    Username = chatter.Username,
                    IsBot = chatter.IsBot,
                    DiscordId = discord.DiscordUserId,
                    Discriminator = discord.Discriminator,
                };

            case { Telegram: { } telegram }:
                return new TelegramChatterDto()
                {
                    Id = chatter.Id,
                    DisplayName = chatter.DisplayName,
                    Username = chatter.Username,
                    IsBot = chatter.IsBot,
                    TelegramId = telegram.TelegramId,
                    FirstName = telegram.FirstName,
                    LastName = telegram.LastName,
                    LanguageCode = telegram.LanguageCode,
                    HasPremium = telegram.HasPremium,
                    AddedToAttachmentMenu = telegram.AddedToAttachmentMenu,
                };

            case { Twitch: { } twitch }:
                return new TwitchChatterDto()
                {
                    Id = chatter.Id,
                    DisplayName = chatter.DisplayName,
                    Username = chatter.Username,
                    IsBot = chatter.IsBot,
                    TwitchId = twitch.TwitchId,
                };

            default:
                throw new NotImplementedException();
        }
    }

    public static ConnectionDto ToDto(this ConnectionEntity connection, ExtendedConnectionStatus status)
    {
        switch (connection.Protocol)
        {
            case Protocol.Discord:
                return new DiscordConnectionDto()
                {
                    Id = connection.Id,
                    Name = connection.Name,
                    Protocol = connection.Protocol,
                    AutoStart = connection.AutoStart,
                    Config = connection.Configuration,
                    ExtendedStatus = status,
                };

            case Protocol.Telegram:
                return new DiscordConnectionDto()
                {
                    Id = connection.Id,
                    Name = connection.Name,
                    Protocol = connection.Protocol,
                    AutoStart = connection.AutoStart,
                    Config = connection.Configuration,
                    ExtendedStatus = status,
                };

            case Protocol.Twitch:
                return new DiscordConnectionDto()
                {
                    Id = connection.Id,
                    Name = connection.Name,
                    Protocol = connection.Protocol,
                    AutoStart = connection.AutoStart,
                    Config = connection.Configuration,
                    ExtendedStatus = status,
                };

            default:
                throw new NotImplementedException();
        }
    }

    public static ScriptDto ToDto(this ScriptEntity script, ScriptStatus status)
    {
        return new ScriptDto(
            script.Id,
            script.Name,
            script.Description,
            script.AutoStart,
            script.Code,
            status
        );
    }

    public static ProxyDto ToDto(this ProxyEntity proxy)
    {
        return new ProxyDto(
            proxy.Id,
            proxy.Name,
            proxy.Type,
            proxy.Hostname,
            proxy.Port,
            proxy.IsAuthRequired,
            proxy.Username,
            proxy.Password
        );
    }
}
