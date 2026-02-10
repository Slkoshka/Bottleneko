using Akka.Actor;
using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Connections;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Database.Schema.Protocols.Discord;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Utils;
using Discord;
using Discord.Net;
using Discord.Net.Rest;
using Discord.Net.WebSockets;
using Discord.Rest;
using Discord.WebSocket;
using Microsoft.EntityFrameworkCore;
using System.Net.WebSockets;
using DiscordLogSeverity = Discord.LogSeverity;
using MessageType = Discord.MessageType;
using NekoLogSeverity = Bottleneko.Logging.LogSeverity;

namespace Bottleneko.Protocols.Discord;

class DiscordConnection(StaticConnectionCreationData<DiscordProtocolConfiguration> data) : StaticConnectionBase<DiscordProtocolConfiguration>(data), IProtocol, IAsyncDisposable
{
    public const Protocol ProtocolId = Protocol.Discord;
    public const string LogCategory = "Bottleneko.Discord";

    private DiscordRestClient _rest = null!;
    private DiscordSocketClient? _client = null;
    private bool _disposed = false;

    public static ProtocolDescription GetDescription()
    {
        return ProtocolDescription.Make<DiscordProtocolConfiguration>(ProtocolId, (data) => new DiscordConnection(data), TestAsync);
    }

    private static GatewayIntents GetIntents(DiscordProtocolConfiguration config)
    {
        return GatewayIntents.AllUnprivileged
            | (config.IsPresenceIntentEnabled ? GatewayIntents.GuildPresences : 0)
            | (config.IsServerMembersIntentEnabled ? GatewayIntents.GuildMembers : 0)
            | (config.IsMessageContentIntentEnabled ? GatewayIntents.MessageContent : 0);
    }

    private static async Task<(DiscordRestClient RestClient, DiscordSocketClient? SocketClient)> CreateAsync(StaticProtocolContext<DiscordProtocolConfiguration> context)
    {
        var proxy = await GetProxyAsync(context.Configuration.ProxyId);
        var restProvider = DefaultRestClientProvider.Create(proxy is not null, proxy);

        var rest = new DiscordRestClient(new DiscordRestConfig()
        {
            RestClientProvider = restProvider,
        });

        var client = context.Configuration.ReceiveEvents ? new DiscordSocketClient(new DiscordSocketConfig
        {
            GatewayIntents = GetIntents(context.Configuration),
            RestClientProvider = restProvider,
            WebSocketProvider = DefaultWebSocketProvider.Create(proxy),
        }) : null;

        return (rest, client);
    }

    public override async Task StartAsync()
    {
        (_rest, _client) = await CreateAsync(Context);

        try
        {
            await _rest.LoginAsync(TokenType.Bot, Configuration.Token);

            if (_client is not null)
            {
                _client.Connected += Client_ConnectedAsync;
                _client.Log += Client_LogAsync;
                _client.MessageReceived += Client_MessageReceivedAsync;
                _client.Disconnected += Client_DisconnectedAsync;

                await _client.LoginAsync(TokenType.Bot, Configuration.Token);
                await _client.StartAsync();
            }
            else
            {
                Connected();
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            Logger.LogWarning(LogCategory, "An error has occured during connection startup", ex);
            RequestRestart(false);
        }
    }

    private Task Client_ConnectedAsync()
    {
        Connected();
        return Task.CompletedTask;
    }

    private Task Client_LogAsync(LogMessage message)
    {
        Logger.Log(message.Severity switch
        {
            DiscordLogSeverity.Critical => NekoLogSeverity.Critical,
            DiscordLogSeverity.Error => NekoLogSeverity.Error,
            DiscordLogSeverity.Warning => NekoLogSeverity.Warning,
            DiscordLogSeverity.Info => NekoLogSeverity.Info,
            DiscordLogSeverity.Verbose => NekoLogSeverity.Verbose,
            DiscordLogSeverity.Debug => NekoLogSeverity.Debug,
            _ => NekoLogSeverity.Debug,
        }, message.Source, message.Message, message.Exception);
        return Task.CompletedTask;
    }

    private async Task<ChatEntity> SaveChatAsync(NekoDbContext db, IChannel channel)
    {
        var guildChannelId = (channel as IGuildChannel)?.GuildId;
        var discordChat = await db.DiscordChats.SingleOrDefaultAsync(chat => chat.ConnectionId == ConnectionId && chat.DiscordGuildId == guildChannelId && chat.DiscordChannelId == channel.Id) ?? new DiscordChatEntity()
        {
            ConnectionId = ConnectionId,
            DiscordGuildId = guildChannelId,
            DiscordChannelId = channel.Id,
        };
        var chat = new ChatEntity()
        {
            Id = discordChat.ChatId,
            ConnectionId = ConnectionId,
            DisplayName = channel switch
            {
                IGroupChannel groupChannel => $"{groupChannel.Name}",
                IGuildChannel guildChannel => $"'{guildChannel!.Guild.Name}' - #{guildChannel.Name}",
                _ => $"{channel.Name}",
            },
            IsPrivate = channel is IDMChannel,
            Discord = discordChat,
        };

        db.Chats.Update(chat);

        return chat;
    }

    private async Task<ChatterEntity> SaveChatterAsync(NekoDbContext db, SocketUser user)
    {
        var discordChatter = await db.DiscordChatters.SingleOrDefaultAsync(chatter => chatter.ConnectionId == ConnectionId && chatter.DiscordUserId == user.Id) ?? new DiscordChatterEntity()
        {
            ConnectionId = ConnectionId,
            DiscordUserId = user.Id,
            Discriminator = user.Discriminator == "0000" ? null : user.Discriminator,
        };
        var chatter = new ChatterEntity()
        {
            Id = discordChatter.ChatterId,
            ConnectionId = ConnectionId,
            Username = $"{user.Username}{(user.DiscriminatorValue == 0 ? "" : $"#{user.Discriminator}")}",
            DisplayName = user.GlobalName ?? user.Username,
            IsBot = user.IsBot,
            Discord = discordChatter,
        };

        db.Chatters.Update(chatter);

        return chatter;
    }

    private async Task<ChatMessageEntity> SaveChatMessageAsync(NekoDbContext db, SocketMessage message, ChatEntity chat, ChatterEntity author)
    {
        var guildId = (message.Channel as IGuildChannel)?.GuildId;
        var discordChatMessage = await db.DiscordChatMessages.Include(chatMessage => chatMessage.ChatMessage).ThenInclude(chatMessage => chatMessage.Attachments).ThenInclude(attachment => attachment.Discord).SingleOrDefaultAsync(chatMessage =>
            chatMessage.ConnectionId == ConnectionId &&
            chatMessage.DiscordGuildId == guildId &&
            chatMessage.DiscordChannelId == message.Channel.Id &&
            chatMessage.DiscordMessageId == message.Id) ?? new DiscordChatMessageEntity()
            {
                ConnectionId = ConnectionId,
                DiscordGuildId = guildId,
                DiscordChannelId = message.Channel.Id,
                DiscordMessageId = message.Id,
                IsPinned = message.IsPinned,
                IsEveryoneMentioned = message.MentionedEveryone,
                ChannelMentions = [.. message.MentionedChannels.Select(channel => channel.Id)],
                RoleMentions = [.. message.MentionedRoleIds],
                UserMentions = [.. message.MentionedRoleIds],
            };
        var replyTo = message.Type == MessageType.Reply ? await message.Channel.GetMessageAsync(message.Reference.MessageId.Value, CacheMode.AllowDownload) : null;
        var chatMessage = new ChatMessageEntity()
        {
            Id = discordChatMessage.ChatMessageId,
            ConnectionId = ConnectionId,
            RemoteTimestamp = message.Timestamp.UtcDateTime,
            Chat = chat,
            ChatId = chat.Id,
            Author = author,
            CustomAuthorName = message.Author is IGuildUser guildUser ? guildUser.DisplayName : null,
            AuthorId = author.Id,
            TextContent = string.IsNullOrEmpty(message.Content) ? null : message.Content,
            IsSpecial = message.Type is not MessageType.Default and not MessageType.Reply,
            IsDirect = message.Channel is IDMChannel || message.MentionedUsers.Any(user => user.Id == _rest.CurrentUser.Id) || replyTo?.Author.Id == _rest.CurrentUser.Id,
            IsOffline = false,
            ReplyToId = replyTo is null ? null : (await db.DiscordChatMessages.SingleOrDefaultAsync(chatMessage =>
                chatMessage.ChatMessage.ConnectionId == ConnectionId &&
                chatMessage.DiscordGuildId == guildId &&
                chatMessage.DiscordChannelId == message.Channel.Id &&
                chatMessage.DiscordMessageId == replyTo.Id))?.ChatMessageId,
            Attachments = [..message.Attachments.Select(attachment => discordChatMessage.ChatMessage?.Attachments.FirstOrDefault(savedAttachment => savedAttachment.ConnectionId == ConnectionId && savedAttachment.Discord?.DiscordAttachmentId == attachment.Id) ?? new ChatMessageAttachmentEntity()
            {
                ConnectionId = ConnectionId,
                ContentType = attachment.ContentType ?? "application/octet-stream",
                FileName = attachment.Filename,
                Discord = new DiscordChatMessageAttachmentEntity()
                {
                    ConnectionId = ConnectionId,
                    DiscordGuildId = guildId,
                    DiscordChannelId = message.Channel.Id,
                    DiscordAttachmentId = attachment.Id,
                    Title = attachment.Title,
                    Description = attachment.Description,
                    Url = attachment.Url,
                    ProxyUrl = attachment.ProxyUrl,
                },
            })],
            Discord = discordChatMessage,
        };

        if (discordChatMessage.ChatMessage is not null)
        {
            db.Entry(discordChatMessage.ChatMessage).CurrentValues.SetValues(chatMessage);
            chatMessage = discordChatMessage.ChatMessage;
        }
        else
        {
            db.ChatMessages.Update(chatMessage);
        }

        return chatMessage;
    }

    private async Task Client_MessageReceivedAsync(SocketMessage message)
    {
        if (message.Author.Id == _rest.CurrentUser.Id)
        {
            return;
        }

        await using var db = NekoDbContext.Get();

        var chat = await SaveChatAsync(db, message.Channel);
        var author = await SaveChatterAsync(db, message.Author);
        var msg = await SaveChatMessageAsync(db, message, chat, author);

        await db.SaveChangesAsync();

        MessageReceived(msg);
    }

    private Task Client_DisconnectedAsync(Exception exception)
    {
        // For reference: https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway-gateway-close-event-codes
        if (exception is WebSocketException && exception.InnerException is WebSocketClosedException { CloseCode: 4004 or 4010 or 4011 or 4012 or 4013 or 4014 })
        {
            Die(exception.InnerException);
        }
        else
        {
            if (!_disposed)
            {
                RequestRestart(true);
            }
        }

        return Task.CompletedTask;
    }

    public static async Task<object?> TestAsync(StaticProtocolContext<DiscordProtocolConfiguration> context, CancellationToken cancellationToken)
    {
        var (rest, client) = await CreateAsync(context);

        try
        {
            await rest.LoginAsync(TokenType.Bot, context.Configuration.Token);

            if (client is null)
            {
                var me = await rest.GetCurrentUserAsync();
                return new
                {
                    User = new
                    {
                        me.Id,
                        Username = $"{me.Username}#{me.Discriminator}",
                        Avatar = me.GetAvatarUrl(),
                    },
                };
            }
            else
            {
                var tcs = new TaskCompletionSource<ISelfUser>();
                var log = new List<LogMessage>();

                Task OnConnectedAsync()
                {
                    tcs.SetResult(client.CurrentUser);
                    return Task.CompletedTask;
                }

                Task OnLogAsync(LogMessage message)
                {
                    log.Add(message);
                    return Task.CompletedTask;
                }

                Task OnDisconnectedAsync(Exception exception)
                {
                    if (exception is WebSocketException && exception.InnerException is WebSocketClosedException wsException)
                    {
                        tcs.SetException(wsException);
                    }
                    else
                    {
                        tcs.SetException(exception);
                    }

                    return Task.CompletedTask;
                }

                client.Connected += OnConnectedAsync;
                client.Log += OnLogAsync;
                client.Disconnected += OnDisconnectedAsync;

                try
                {
                    var cancelTask = cancellationToken.WaitHandle.WaitOneAsync();
                    await Task.WhenAny(client.LoginAsync(TokenType.Bot, context.Configuration.Token), cancelTask);
                    await Task.WhenAny(client.StartAsync(), cancelTask);
                    await Task.WhenAny(tcs.Task, cancelTask);

                    cancellationToken.ThrowIfCancellationRequested();
                }
                finally
                {
                    client.Connected -= OnConnectedAsync;
                    client.Disconnected -= OnDisconnectedAsync;
                }

                var me = await tcs.Task;

                return new
                {
                    User = new
                    {
                        me.Id,
                        Username = $"{me.Username}#{me.Discriminator}",
                        Avatar = me.GetAvatarUrl(),
                    },
                    Log = log.Select(message => new
                    {
                        Level = message.Severity,
                        message.Source,
                        message.Message,
                        Exception = message.Exception?.Message,
                    }).ToArray(),
                };
            }
        }
        finally
        {
            if (client is not null)
            {
                await client.DisposeAsync();
            }
            await rest.DisposeAsync();
        }
    }

    public override async Task HandleMessageAsync(IActorRef sender, IHandledByConnection message)
    {
        switch (message)
        {
            case ConnectionMessages.ProxyUpdated proxyUpdated:
                {
                    if (!string.IsNullOrEmpty(Configuration.ProxyId) && long.TryParse(Configuration.ProxyId, out var proxyId) && proxyId == proxyUpdated.ProxyId)
                    {
                        RequestRestart(true);
                    }
                    break;
                }

            case ConnectionMessages.GetAttachment getAttachment:
                {
                    await using var db = NekoDbContext.Get();
                    var attachment = await db.MessageAttachments.Include(attachment => attachment.Discord).Include(attachment => attachment.Message.Discord).SingleOrDefaultAsync(attachment => attachment.Id == getAttachment.AttachmentId);
                    if (attachment is null || attachment.Discord is null || attachment.Message.Discord is null)
                    {
                        sender.Tell(null);
                        break;
                    }
                    if (await _rest.GetChannelAsync(attachment.Discord.DiscordChannelId) is not ITextChannel channel)
                    {
                        sender.Tell(null);
                        break;
                    }
                    if (await channel.GetMessageAsync(attachment.Message.Discord.DiscordMessageId) is not IUserMessage msg)
                    {
                        sender.Tell(null);
                        break;
                    }
                    sender.Tell(msg.Attachments.SingleOrDefault(a => a.Id == attachment.Discord.DiscordAttachmentId)?.ProxyUrl);
                    break;
                }

            case ConnectionMessages.SendText sendText:
                {
                    await using var db = NekoDbContext.Get();
                    if (db.Chats.SingleOrDefault(chat => chat.Id == sendText.ChatId) is { Discord: { } discordChat })
                    {
                        if (await _rest.GetChannelAsync(discordChat.DiscordChannelId) is ITextChannel channel)
                        {
                            if (sendText.ReplyToMessageId is not null)
                            {
                                if (db.ChatMessages.SingleOrDefault(message => message.Id == sendText.ReplyToMessageId) is { Discord: { } discordMessage })
                                {
                                    if (await channel.GetMessageAsync(discordMessage.DiscordMessageId) is { } originalMessage)
                                    {
                                        await channel.SendMessageAsync(sendText.Text, messageReference: new MessageReference(originalMessage.Id, originalMessage.Channel.Id, originalMessage.Channel is IGuildChannel guildChannel ? guildChannel.GuildId : null, true));
                                    }
                                }
                            }
                            else
                            {
                                await channel.SendMessageAsync(sendText.Text);
                            }
                        }
                    }
                    break;
                }
        }
    }

    public override async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        _disposed = true;
        if (_client is not null)
        {
            await _client.DisposeAsync();
        }
        if (_rest is not null)
        {
            await _rest.DisposeAsync();
        }
    }
}
