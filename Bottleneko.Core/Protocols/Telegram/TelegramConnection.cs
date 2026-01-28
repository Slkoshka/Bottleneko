using Akka.Actor;
using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Connections;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Database.Schema.Protocols.Telegram;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Microsoft.EntityFrameworkCore;
using Telegram.Bot;
using Telegram.Bot.Exceptions;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace Bottleneko.Protocols.Telegram;

class TelegramConnection(StaticConnectionCreationData<TelegramProtocolConfiguration> data) : StaticConnectionBase<TelegramProtocolConfiguration>(data), IProtocol, IAsyncDisposable
{
    public const Protocol ProtocolId = Protocol.Telegram;
    public const string LogCategory = "Bottleneko.Telegram";

    private TelegramBotClient _bot = null!;
    private readonly CancellationTokenSource _cts = new();
    private Task _mainLoopTask = Task.CompletedTask;
    private User _me = null!;

    public static ProtocolDescription GetDescription()
    {
        return ProtocolDescription.Make<TelegramProtocolConfiguration>(ProtocolId, (data) => new TelegramConnection(data), TestAsync);
    }

    public static string FormatName(string firstName, string? lastName) => lastName is null ? firstName : $"{firstName} {lastName}";

    private static async Task<TelegramBotClient> CreateAsync(StaticProtocolContext<TelegramProtocolConfiguration> context)
    {
        var proxy = await GetProxyAsync(context.Configuration.ProxyId);
        return new TelegramBotClient(context.Configuration.Token, new HttpClient(new HttpClientHandler()
        {
            UseProxy = proxy is not null,
            Proxy = proxy,
        }));
    }

    public override async Task StartAsync()
    {
        _bot = await CreateAsync(Context);

        try
        {
            _me = await _bot.GetMe();
        }
        catch (RequestException ex)
        {
            Logger.LogWarning(LogCategory, "An error has occured during connection startup", ex);
            RequestRestart(false);
            return;
        }

        if (Configuration.ReceiveEvents)
        {
            _mainLoopTask = MainLoopAsync(_cts.Token);
        }
        else
        {
            Connected();
        }
    }

    private bool IsMentioningMe(Message message, MessageEntity entity)
    {
        switch (entity)
        {
            case { Type: MessageEntityType.TextMention, User: not null }:
                return entity.User.Id == _me.Id;

            case { Type: MessageEntityType.Mention }:
                return string.Compare((message.Text ?? message.Caption ?? "")[(entity.Offset + 1)..(entity.Offset + entity.Length)], _me.Username, StringComparison.OrdinalIgnoreCase) == 0;

            case { Type: MessageEntityType.BotCommand, Offset: 0 }:
                var command = (message.Text ?? message.Caption ?? "")[entity.Offset..(entity.Offset + entity.Length)];
                var index = command.IndexOf('@');
                return index != -1 && string.Compare(command[(index + 1)..], _me.Username, StringComparison.OrdinalIgnoreCase) == 0;

            default:
                return false;
        }
    }

    private async Task HandleTelegramMessageAsync(Update update, Message message, bool isOffline)
    {
        if (message.From is null)
        {
            return;
        }

        await using var db = NekoDbContext.Get();

        var telegramChat = await db.TelegramChats.Include(chat => chat.Chat).SingleOrDefaultAsync(chat => chat.ConnectionId == ConnectionId && chat.TelegramId == message.Chat.Id) ?? new TelegramChatEntity()
        {
            ConnectionId = ConnectionId,
            TelegramId = message.Chat.Id,
        };
        var chat = new ChatEntity()
        {
            Id = telegramChat.ChatId,
            ConnectionId = ConnectionId,
            DisplayName = message.Chat.Title ?? (message.Chat.FirstName is not null ? FormatName(message.Chat.FirstName, message.Chat.LastName) : message.Chat.Id.ToString()),
            IsPrivate = message.Chat.Type == ChatType.Private,
            Telegram = telegramChat,
        };
        if (telegramChat.Chat is not null)
        {
            db.Entry(telegramChat.Chat).CurrentValues.SetValues(chat);
            chat = telegramChat.Chat;
        }
        else
        {
            db.Chats.Update(chat);
        }

        var telegramAuthor = await db.TelegramChatters.Include(chatter => chatter.Chatter).SingleOrDefaultAsync(chatter => chatter.ConnectionId == ConnectionId && chatter.TelegramId == message.From.Id) ?? new TelegramChatterEntity()
        {
            ConnectionId = ConnectionId,
            TelegramId = message.From.Id,
        };
        var author = new ChatterEntity()
        {
            Id = telegramAuthor.ChatterId,
            ConnectionId = ConnectionId,
            DisplayName = FormatName(message.From.FirstName, message.From.LastName),
            Username = message.From.Username ?? $"id:{message.From.Id}",
            IsBot = message.From.IsBot,
            Telegram = telegramAuthor,
        };
        if (telegramAuthor.Chatter is not null)
        {
            db.Entry(telegramAuthor.Chatter).CurrentValues.SetValues(author);
            author = telegramAuthor.Chatter;
        }
        else
        {
            db.Chatters.Update(author);
        }

        var telegramChatMessage = await db.TelegramChatMessages.Include(chatMessage => chatMessage.ChatMessage).ThenInclude(chatMessage => chatMessage.Attachments).ThenInclude(attachment => attachment.Telegram).SingleOrDefaultAsync(chatMessage =>
            chatMessage.ChatMessage.ConnectionId == ConnectionId &&
            chatMessage.TelegramId == message.Id) ?? new TelegramChatMessageEntity()
            {
                ConnectionId = ConnectionId,
                TelegramChatId = message.Chat.Id,
                TelegramId = message.Id,
                TelegramMediaGroupId = message.MediaGroupId,
            };
        var msg = new ChatMessageEntity()
        {
            Id = telegramChatMessage.ChatMessageId,
            ConnectionId = ConnectionId,
            RemoteTimestamp = message.Date,
            Chat = chat,
            ChatId = chat.Id,
            Author = author,
            AuthorId = author.Id,
            TextContent = message.Text ?? message.Caption,
            IsSpecial = message.IsServiceMessage || message.ForwardFromMessageId is not null,
            IsDirect = message.Chat.Type == ChatType.Private || ((message.Entities ?? message.CaptionEntities)?.Any(entity => IsMentioningMe(message, entity)) ?? false),
            IsOffline = isOffline,
            ReplyToId = message.ReplyToMessage is null ? null : (await db.TelegramChatMessages.SingleOrDefaultAsync(chatMessage =>
                chatMessage.ChatMessage.ConnectionId == ConnectionId &&
                chatMessage.TelegramId == message.Id))?.Id,
            Telegram = telegramChatMessage,
        };
        var addToGroup = false;
        if (message.MediaGroupId is not null)
        {
            var group = await db.TelegramChatMessages.Include(chatMessage => chatMessage.ChatMessage).ThenInclude(chatMessage => chatMessage.Attachments).ThenInclude(attachment => attachment.Telegram).SingleOrDefaultAsync(msg => msg.ConnectionId == ConnectionId && msg.TelegramChatId == message.Chat.Id && msg.TelegramMediaGroupId == message.MediaGroupId);
            if (group is not null)
            {
                telegramChatMessage = group;
                msg = group.ChatMessage;
                addToGroup = true;
            }
        }

        if (!addToGroup)
        {
            if (telegramChatMessage.ChatMessage is not null)
            {
                db.Entry(telegramChatMessage.ChatMessage).CurrentValues.SetValues(msg);
                msg = telegramChatMessage.ChatMessage;
            }
            else
            {
                db.ChatMessages.Update(msg);
            }
        }

        var attachments = new List<(ChatMessageAttachmentEntity Entity, FileBase File)>();

        void AddAttachment(TelegramChatMessageAttachmentType type, FileBase file, string mimeType, string? filename)
        {
            var savedAttachment = telegramChatMessage.ChatMessage?.Attachments.SingleOrDefault(attachment => attachment.Telegram?.ConnectionId == ConnectionId && attachment.Telegram?.TelegramAttachmentType == type && attachment.Telegram.TelegramChatId == message.Chat.Id && attachment.Telegram.TelegramMessageId == message.Id);
            if (savedAttachment is null)
            {
                savedAttachment = new ChatMessageAttachmentEntity()
                {
                    ConnectionId = ConnectionId,
                    MessageId = msg.Id,
                    Message = msg,
                    ContentType = mimeType,
                    FileName = filename,
                    Telegram = new TelegramChatMessageAttachmentEntity()
                    {
                        ConnectionId = ConnectionId,
                        TelegramAttachmentType = type,
                        TelegramChatId = message.Chat.Id,
                        TelegramMessageId = message.Id,
                        TelegramFileId = file.FileId,
                        TelegramFileUniqueId = file.FileUniqueId,
                    },
                };
                db.MessageAttachments.Add(savedAttachment);
            }
            else
            {
                savedAttachment.ContentType = mimeType;
                savedAttachment.FileName = filename;
                savedAttachment.Telegram!.TelegramFileId = file.FileId;
                savedAttachment.Telegram!.TelegramFileUniqueId = file.FileUniqueId;

                db.MessageAttachments.Update(savedAttachment);
            }

            attachments.Add((savedAttachment, file));
        }

        if (message.Animation is not null)
        {
            AddAttachment(TelegramChatMessageAttachmentType.Animation, message.Animation, message.Animation.MimeType ?? "application/octet-stream", message.Animation.FileName);
        }
        if (message.Audio is not null)
        {
            AddAttachment(TelegramChatMessageAttachmentType.Audio, message.Audio, message.Audio.MimeType ?? "application/octet-stream", message.Audio.FileName ?? "audio.ogg");
        }
        if (message.Document is not null)
        {
            AddAttachment(TelegramChatMessageAttachmentType.Document, message.Document, message.Document.MimeType ?? "application/octet-stream", message.Document.FileName);
        }
        if (message.Photo is not null && message.Photo.Length > 0)
        {
            AddAttachment(TelegramChatMessageAttachmentType.Photo, message.Photo.OrderByDescending(p => p.Width).First(), "image/jpeg", "photo.jpg");
        }
        if (message.Video is not null)
        {
            AddAttachment(TelegramChatMessageAttachmentType.Video, message.Video, message.Video.MimeType ?? "video/mp4", message.Video.FileName ?? "video.mp4");
        }
        if (message.VideoNote is not null)
        {
            AddAttachment(TelegramChatMessageAttachmentType.VideoNote, message.VideoNote, "video/mp4", "note.mp4");
        }
        if (message.Voice is not null)
        {
            AddAttachment(TelegramChatMessageAttachmentType.Voice, message.Voice, message.Voice.MimeType ?? "audio/ogg", "voice.ogg");
        }

        await db.SaveChangesAsync();

        if (update.Type != UpdateType.Message)
        {
            return;
        }

        MessageReceived(msg);
    }

    private async Task HandleTelegramUpdateAsync(Update update, bool isOffline)
    {
        switch (update.Type)
        {
            case UpdateType.Message when update.Message is not null:
                await HandleTelegramMessageAsync(update, update.Message, isOffline);
                break;

            case UpdateType.EditedMessage when update.EditedMessage is not null:
                await HandleTelegramMessageAsync(update, update.EditedMessage, isOffline);
                break;

            case UpdateType.ChannelPost when update.ChannelPost is not null:
                await HandleTelegramMessageAsync(update, update.ChannelPost, isOffline);
                break;

            case UpdateType.EditedChannelPost when update.EditedChannelPost is not null:
                await HandleTelegramMessageAsync(update, update.EditedChannelPost, isOffline);
                break;
        }
    }

    private async Task MainLoopAsync(CancellationToken cancellationToken)
    {
        var isInitialReceive = true;
        int? lastUpdateId = null;

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                Update[] updates;
                try
                {
                    updates = await _bot.GetUpdates(lastUpdateId is null ? null : lastUpdateId + 1, timeout: isInitialReceive ? 0 : 30, cancellationToken: cancellationToken);
                }
                catch (RequestException)
                {
                    RequestRestart(true);
                    break;
                }

                if (updates.Length == 0)
                {
                    isInitialReceive = false;
                    Connected();
                    continue;
                }

                lastUpdateId = updates[^1].Id;

                foreach (var update in updates)
                {
                    try
                    {
                        await HandleTelegramUpdateAsync(update, isInitialReceive);
                    }
                    catch (Exception ex)
                    {
                        Logger.LogError(LogCategory, "An error has occured while processing an update", ex);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                Logger.LogWarning(LogCategory, "An error has occured in the update receive loop", ex);
            }
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
                    var attachment = await db.MessageAttachments.Include(attachment => attachment.Telegram).SingleOrDefaultAsync(attachment => attachment.Id == getAttachment.AttachmentId);
                    if (attachment is null || attachment.Telegram is null)
                    {
                        sender.Tell(null);
                        break;
                    }
                    sender.Tell($"https://api.telegram.org/file/bot{Configuration.Token}/{(await _bot.GetFile(attachment.Telegram.TelegramFileId)).FilePath}");
                    break;
                }
        }
    }

    public static async Task<object?> TestAsync(StaticProtocolContext<TelegramProtocolConfiguration> context, CancellationToken cancellationToken)
    {
        var telegram = await CreateAsync(context);
        var me = await telegram.GetMe(cancellationToken);

        return new
        {
            User = new
            {
                me.Id,
                me.Username,
                DisplayName = FormatName(me.FirstName, me.LastName),
                me.CanConnectToBusiness,
                me.CanJoinGroups,
                me.CanReadAllGroupMessages,
                me.HasMainWebApp,
                me.SupportsInlineQueries,
            },
        };
    }

    public override async ValueTask DisposeAsync()
    {
        await _cts.CancelAsync();
#pragma warning disable VSTHRD003 // Avoid awaiting foreign Tasks
        await _mainLoopTask;
#pragma warning restore VSTHRD003 // Avoid awaiting foreign Tasks
        _cts.Dispose();
    }
}
