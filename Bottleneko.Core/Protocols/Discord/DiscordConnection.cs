using System.Net.WebSockets;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Logging;
using Bottleneko.Utils;
using Discord;
using Discord.Net;
using Discord.Rest;
using Discord.WebSocket;
using Microsoft.EntityFrameworkCore;
using NekoLogSeverity = Bottleneko.Logging.LogSeverity;
using DiscordLogSeverity = Discord.LogSeverity;
using MessageType = Discord.MessageType;
using Bottleneko.Api.Protocols;
using Bottleneko.Api.Dtos;
using Bottleneko.Scripting.Bindings;
using Bottleneko.Connections;
using Bottleneko.Scripting.Bindings.Discord;
using Akka.Actor;
using Bottleneko.Messages;
using Bottleneko.Database.Schema.Protocols.Discord;

namespace Bottleneko.Protocols.Discord;

[Protocol(ProtocolId, typeof(DiscordProtocolConfiguration), typeof(DiscordConnectionBinding))]
class DiscordConnection(IServiceProvider services, INekoLogger logger, ConnectionCreationData<DiscordProtocolConfiguration> data) : ConnectionBase, IAsyncDisposable
{
    public const Protocol ProtocolId = Protocol.Discord;
    public const string LogCategory = "Bottleneko.Discord";

    public IServiceProvider Services { get; } = services;

    private readonly DiscordRestClient _rest = new(new DiscordRestConfig());
    private readonly DiscordSocketClient? _client = data.Configuration.ReceiveEvents ? new DiscordSocketClient(new DiscordSocketConfig { GatewayIntents = GetIntents(data.Configuration) }) : null;
    private bool _disposed = false;

    private static GatewayIntents GetIntents(DiscordProtocolConfiguration config)
    {
        return GatewayIntents.AllUnprivileged
            | (config.IsPresenceIntentEnabled ? GatewayIntents.GuildPresences : 0)
            | (config.IsServerMembersIntentEnabled ? GatewayIntents.GuildMembers : 0)
            | (config.IsMessageContentIntentEnabled ? GatewayIntents.MessageContent : 0);
    }

    public override async Task StartAsync()
    {
        try
        {
            await _rest.LoginAsync(TokenType.Bot, data.Configuration.Token);

            if (_client is not null)
            {
                _client.Connected += Client_ConnectedAsync;
                _client.Log += Client_LogAsync;
                _client.MessageReceived += Client_MessageReceivedAsync;
                _client.Disconnected += Client_DisconnectedAsync;

                await _client.LoginAsync(TokenType.Bot, data.Configuration.Token);
                await _client.StartAsync();
            }
            else
            {
                Connected();
            }
        }
        catch (HttpRequestException)
        {
            RequestRestart();
        }
    }

    private Task Client_ConnectedAsync()
    {
        Connected();
        return Task.CompletedTask;
    }

    private Task Client_LogAsync(LogMessage message)
    {
        logger?.Log(message.Severity switch
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
        var discordChat = await db.DiscordChats.SingleOrDefaultAsync(chat => chat.ConnectionId == data.ConnectionId && chat.DiscordGuildId == guildChannelId && chat.DiscordChannelId == channel.Id) ?? new DiscordChatEntity()
        {
            ConnectionId = data.ConnectionId,
            DiscordGuildId = guildChannelId,
            DiscordChannelId = channel.Id,
        };
        var chat = new ChatEntity()
        {
            Id = discordChat.ChatId,
            ConnectionId = data.ConnectionId,
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
        var discordChatter = await db.DiscordChatters.SingleOrDefaultAsync(chatter => chatter.ConnectionId == data.ConnectionId && chatter.DiscordUserId == user.Id) ?? new DiscordChatterEntity()
        {
            ConnectionId = data.ConnectionId,
            DiscordUserId = user.Id,
        };
        var chatter = new ChatterEntity()
        {
            Id = discordChatter.ChatterId,
            ConnectionId = data.ConnectionId,
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
            chatMessage.ConnectionId == data.ConnectionId &&
            chatMessage.DiscordGuildId == guildId &&
            chatMessage.DiscordChannelId == message.Channel.Id &&
            chatMessage.DiscordMessageId == message.Id) ?? new DiscordChatMessageEntity()
        {
            ConnectionId = data.ConnectionId,
            DiscordGuildId = guildId,
            DiscordChannelId = message.Channel.Id,
            DiscordMessageId = message.Id,
        };
        var replyTo = message.Type == MessageType.Reply ? await message.Channel.GetMessageAsync(message.Reference.MessageId.Value, CacheMode.AllowDownload) : null;
        var chatMessage = new ChatMessageEntity()
        {
            Id = discordChatMessage.ChatMessageId,
            ConnectionId = data.ConnectionId,
            RemoteTimestamp = message.Timestamp.UtcDateTime,
            Chat = chat,
            ChatId = chat.Id,
            Author = author,
            AuthorId = author.Id,
            TextContent = string.IsNullOrEmpty(message.Content) ? null : message.Content,
            IsSpecial = message.Type is not MessageType.Default or MessageType.Reply,
            IsDirect = message.Channel is IDMChannel || message.MentionedUsers.Any(user => user.Id == _rest.CurrentUser.Id) || replyTo?.Author.Id == _rest.CurrentUser.Id,
            IsOffline = false,
            ReplyToId = replyTo is null ? null : (await db.DiscordChatMessages.SingleOrDefaultAsync(chatMessage =>
                chatMessage.ChatMessage.ConnectionId == data.ConnectionId &&
                chatMessage.DiscordGuildId == guildId &&
                chatMessage.DiscordChannelId == message.Channel.Id &&
                chatMessage.DiscordMessageId == replyTo.Id))?.ChatMessageId,
            Attachments = [..message.Attachments.Select(attachment => discordChatMessage.ChatMessage?.Attachments.FirstOrDefault(savedAttachment => savedAttachment.ConnectionId == data.ConnectionId && savedAttachment.Discord?.DiscordAttachmentId == attachment.Id) ?? new ChatMessageAttachmentEntity()
            {
                ConnectionId = data.ConnectionId,
                ContentType = attachment.ContentType ?? "application/octet-stream",
                FileName = attachment.Filename,
                Discord = new DiscordChatMessageAttachmentEntity()
                {
                    ConnectionId = data.ConnectionId,
                    DiscordGuildId = guildId,
                    DiscordChannelId = message.Channel.Id,
                    DiscordAttachmentId = attachment.Id,
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

        var msgBinding = new ChatMessageBinding(data.Owner)
        {
            id = msg.Id,
            protocol = ProtocolId,
            connectionId = data.ConnectionId,
            timestamp = message.Timestamp.UtcDateTime,
            attachments = [.. message.Attachments.Select(attachment => new ChatMessageAttachmentBinding()
            {
                id = attachment.Id,
                messageId = msg.Id,
                contentType = attachment.ContentType ?? "application/octet-stream",
                fileName = attachment.Filename,
                raw = new DiscordChatMessageAttachmentBinding(attachment),
            })],
            chat = new ChatBinding(data.Owner)
            {
                id = chat.Id,
                protocol = ProtocolId,
                connectionId = data.ConnectionId,
                displayName = chat.DisplayName,
                flags = new ChatFlags()
                {
                    isPrivate = chat.IsPrivate,
                },
                raw = new DiscordChatBinding(message.Channel),
            },
            author = new ChatterBinding()
            {
                id = author.Id,
                protocol = ProtocolId,
                connectionId = data.ConnectionId,
                displayName = author.DisplayName,
                username = author.Username,
                flags = new ChatterFlags()
                {
                    isBot = author.IsBot,
                },
                raw = new DiscordChatterBinding(message.Author),
            },
            text = msg.TextContent,
            replyToId = msg.ReplyToId,
            flags = new ChatMessageFlags()
            {
                isSpecial = msg.IsSpecial,
                isDirect = msg.IsDirect,
                isOffline = msg.IsOffline,
            },
            raw = new DiscordChatMessageBinding(message),
        };

        MessageReceived(msg, msgBinding);
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
                RequestRestart();
            }
        }

        return Task.CompletedTask;
    }

    public static async Task<object?> TestAsync(IServiceProvider _, DiscordProtocolConfiguration config, CancellationToken cancellationToken)
    {
        await using var client = new DiscordSocketClient(new() { GatewayIntents = GetIntents(config) });

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
            await Task.WhenAny(client.LoginAsync(TokenType.Bot, config.Token), cancelTask);
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

    public override async Task HandleMessageAsync(IActorRef sender, IConnectionsMessage message)
    {
        switch (message)
        {
            case IConnectionsMessage.SimpleReply simpleReply:
                {
                    try
                    {
                        if (_client is not null && simpleReply.ReplyTo.chat.raw is DiscordChatBinding discordChat && discordChat.channel.Channel is ITextChannel textChannel && simpleReply.ReplyTo.raw is DiscordChatMessageBinding discordMessage)
                        {
                            await textChannel.SendMessageAsync(simpleReply.Text, messageReference: new MessageReference((ulong)discordMessage.id));
                        }
                        else
                        {
                            throw new InvalidOperationException("Client is not connected, message is not a Discord message, or you are trying to post in a non-text channel.");
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(LogCategory, "Failed to send message", ex);
                    }
                    break;
                }

            case IConnectionsMessage.SendMessage sendMessage:
                {
                    try
                    {
                        if (_client is not null && sendMessage.Chat.raw is DiscordChatBinding discordChat && discordChat.channel.Channel is ITextChannel textChannel)
                        {
                            await textChannel.SendMessageAsync(sendMessage.Text);
                        }
                        else
                        {
                            throw new InvalidOperationException("Client is not connected or you are trying to post in a non-text channel.");
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(LogCategory, "Failed to send message", ex);
                    }
                break;
                }

            case IConnectionsMessage.GetAttachment getAttachment:
                {
                    await using var db = NekoDbContext.Get();
                    var attachment = await db.MessageAttachments.Include(attachment => attachment.Discord).Include(attachment => attachment.Message.Discord).SingleOrDefaultAsync(attachment => attachment.Id == getAttachment.AttachmentId);
                    if (attachment is null || attachment.Message.ConnectionId != getAttachment.Id || attachment.Discord is null || attachment.Message.Discord is null)
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

            case IDiscordMessage.GetChat getChat:
                {
                    try
                    {
                        await using var db = NekoDbContext.Get();
                        var channel = await _rest.GetChannelAsync(getChat.ChatId);
                        if (channel is null)
                        {
                            sender.Tell(null);
                            return;
                        }
                        var chat = await SaveChatAsync(db, channel);

                        sender.Tell(new ChatBinding(data.Owner)
                        {
                            id = chat.Id,
                            protocol = ProtocolId,
                            connectionId = data.ConnectionId,
                            displayName = chat.DisplayName,
                            flags = new ChatFlags()
                            {
                                isPrivate = chat.IsPrivate,
                            },
                            raw = new DiscordChatBinding(channel),
                        });
                    }
                    catch (Exception ex)
                    {
                        sender.Tell(new Status.Failure(ex));
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
        await _rest.DisposeAsync();
    }
}
