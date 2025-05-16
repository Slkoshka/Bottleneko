using Akka.Actor;
using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Connections;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Database.Schema.Protocols.Twitch;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Scripting.Bindings;
using Bottleneko.Scripting.Bindings.Twitch;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;
using TwitchLib.Api;
using TwitchLib.Api.Core.Enums;
using TwitchLib.Api.Core.Exceptions;
using TwitchLib.Api.Core.HttpCallHandlers;
using TwitchLib.Api.Helix.Models.EventSub;
using TwitchLib.Api.Helix.Models.Users.GetUsers;
using TwitchLib.EventSub.Core.SubscriptionTypes.Channel;
using TwitchLib.EventSub.Core.SubscriptionTypes.User;
using TwitchLib.EventSub.Websockets;
using TwitchLib.EventSub.Websockets.Client;
using TwitchLib.EventSub.Websockets.Core.EventArgs;
using TwitchLib.EventSub.Websockets.Core.EventArgs.Channel;
using TwitchLib.EventSub.Websockets.Core.EventArgs.User;
using TwitchLib.EventSub.Websockets.Core.Handler;
using TwitchLib.EventSub.Websockets.Interfaces;

namespace Bottleneko.Protocols.Twitch;

[Protocol(ProtocolId, typeof(TwitchProtocolConfiguration), typeof(TwitchConnectionBinding))]
#pragma warning disable CS9113 // Parameter is unread.
class TwitchConnection(IServiceProvider services, INekoLogger logger, ConnectionCreationData<TwitchProtocolConfiguration> data) : ConnectionBase
#pragma warning restore CS9113 // Parameter is unread.
{
    class WebsocketClientServiceProvider(IClientWebsocketProvider clientWebsocketProvider) : IServiceProvider
    {
        public object? GetService(Type serviceType) => serviceType == typeof(WebsocketClient) ? new WebsocketClient(webSocketProvider: clientWebsocketProvider) : null;
    }

    enum ConditionArgument
    {
        ChannelId,
        MyId,
    }
    record EventSubSubscription(string TopicName, string Version, KeyValuePair<string, ConditionArgument>[] Condition, Func<bool, HashSet<TwitchScope>, bool>? Predicate = null);

    public const Protocol ProtocolId = Protocol.Twitch;
    public const string LogCategory = "Bottleneko.Twitch";

    private static readonly Dictionary<TwitchSubscriptionTopic, EventSubSubscription> _subscriptionTypes = new()
    {
        // Only available on the user's channel
        //{ TwitchSubscriptionTopic.ChannelBitsUse, new("channel.bits.use", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.BitsRead)) },
        { TwitchSubscriptionTopic.ChannelCheer, new("channel.cheer", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.BitsRead)) },
        { TwitchSubscriptionTopic.ChannelAdBreakBegin, new("channel.ad_break.begin", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadAds)) },
        { TwitchSubscriptionTopic.ChannelBan, new("channel.ban", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelModerate)) },
        { TwitchSubscriptionTopic.ChannelUnban, new("channel.unban", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelModerate)) },
        { TwitchSubscriptionTopic.ChannelCharityCampaignDonate, new("channel.charity_campaign.donate", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadCharity)) },
        { TwitchSubscriptionTopic.ChannelCharityCampaignStart, new("channel.charity_campaign.start", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadCharity)) },
        { TwitchSubscriptionTopic.ChannelCharityCampaignProgress, new("channel.charity_campaign.progress", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadCharity)) },
        { TwitchSubscriptionTopic.ChannelCharityCampaignStop, new("channel.charity_campaign.stop", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadCharity)) },
        { TwitchSubscriptionTopic.ChannelHypeTrainBegin, new("channel.hype_train.begin", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadHypeTrain)) },
        { TwitchSubscriptionTopic.ChannelHypeTrainProgress, new("channel.hype_train.progress", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadHypeTrain)) },
        { TwitchSubscriptionTopic.ChannelHypeTrainEnd, new("channel.hype_train.end", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadHypeTrain)) },
        { TwitchSubscriptionTopic.ChannelGoalBegin, new("channel.goal.begin", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadGoals)) },
        { TwitchSubscriptionTopic.ChannelGoalProgress, new("channel.goal.progress", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadGoals)) },
        { TwitchSubscriptionTopic.ChannelGoalEnd, new("channel.goal.end", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadGoals)) },
        { TwitchSubscriptionTopic.ChannelModeratorAdd, new("channel.moderator.add", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ModerationRead)) },
        { TwitchSubscriptionTopic.ChannelModeratorRemove, new("channel.moderator.remove", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ModerationRead)) },
        //{ TwitchSubscriptionTopic.ChannelChannelPointsAutomaticRewardRedemptionAdd, new("channel.channel_points_automatic_reward_redemption.add", "2", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadRedemptions) || scopes.Contains(TwitchScope.ChannelManageRedemptions))) },
        { TwitchSubscriptionTopic.ChannelChannelPointsCustomRewardAdd, new("channel.channel_points_custom_reward.add", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadRedemptions) || scopes.Contains(TwitchScope.ChannelManageRedemptions))) },
        { TwitchSubscriptionTopic.ChannelChannelPointsCustomRewardUpdate, new("channel.channel_points_custom_reward.update", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadRedemptions) || scopes.Contains(TwitchScope.ChannelManageRedemptions))) },
        { TwitchSubscriptionTopic.ChannelChannelPointsCustomRewardRemove, new("channel.channel_points_custom_reward.remove", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadRedemptions) || scopes.Contains(TwitchScope.ChannelManageRedemptions))) },
        { TwitchSubscriptionTopic.ChannelChannelPointsCustomRewardRedemptionAdd, new("channel.channel_points_custom_reward_redemption.add", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadRedemptions) || scopes.Contains(TwitchScope.ChannelManageRedemptions))) },
        { TwitchSubscriptionTopic.ChannelChannelPointsCustomRewardRedemptionUpdate, new("channel.channel_points_custom_reward_redemption.update", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadRedemptions) || scopes.Contains(TwitchScope.ChannelManageRedemptions))) },
        { TwitchSubscriptionTopic.ChannelPollBegin, new("channel.poll.begin", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadPolls) || scopes.Contains(TwitchScope.ChannelManagePolls))) },
        { TwitchSubscriptionTopic.ChannelPollProgress, new("channel.poll.progress", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadPolls) || scopes.Contains(TwitchScope.ChannelManagePolls))) },
        { TwitchSubscriptionTopic.ChannelPollEnd, new("channel.poll.end", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadPolls) || scopes.Contains(TwitchScope.ChannelManagePolls))) },
        { TwitchSubscriptionTopic.ChannelPredictionBegin, new("channel.prediction.begin", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadPredictions) || scopes.Contains(TwitchScope.ChannelManagePredictions))) },
        { TwitchSubscriptionTopic.ChannelPredictionProgress, new("channel.prediction.progress", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadPredictions) || scopes.Contains(TwitchScope.ChannelManagePredictions))) },
        { TwitchSubscriptionTopic.ChannelPredictionLock, new("channel.prediction.lock", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadPredictions) || scopes.Contains(TwitchScope.ChannelManagePredictions))) },
        { TwitchSubscriptionTopic.ChannelPredictionEnd, new("channel.prediction.end", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.ChannelReadPredictions) || scopes.Contains(TwitchScope.ChannelManagePredictions))) },
        { TwitchSubscriptionTopic.ChannelSubscribe, new("channel.subscribe", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadSubscriptions)) },
        { TwitchSubscriptionTopic.ChannelSubscriptionEnd, new("channel.subscription.end", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadSubscriptions)) },
        { TwitchSubscriptionTopic.ChannelSubscriptionGift, new("channel.subscription.gift", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadSubscriptions)) },
        { TwitchSubscriptionTopic.ChannelSubscriptionMessage, new("channel.subscription.message", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && scopes.Contains(TwitchScope.ChannelReadSubscriptions)) },
        { TwitchSubscriptionTopic.UserWhisperMessage, new("user.whisper.message", "1", [new("user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => isOwnChannel && (scopes.Contains(TwitchScope.UserReadWhispers) || scopes.Contains(TwitchScope.UserManageWhispers))) },

        // Require the user to be a mod
        { TwitchSubscriptionTopic.ChannelFollow, new("channel.follow", "2", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ModeratorReadFollowers)) },
        { TwitchSubscriptionTopic.ChannelSuspiciousUserUpdate, new("channel.suspicious_user.update", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ModeratorReadSuspiciousUsers)) },
        { TwitchSubscriptionTopic.ChannelSuspiciousUserMessage, new("channel.suspicious_user.message", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ModeratorReadSuspiciousUsers)) },
        { TwitchSubscriptionTopic.ChannelWarningAcknowledge, new("channel.warning.acknowledge", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ModeratorReadWarnings) || scopes.Contains(TwitchScope.ModeratorManageWarnings)) },
        { TwitchSubscriptionTopic.ChannelWarningSend, new("channel.warning.send", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ModeratorReadWarnings) || scopes.Contains(TwitchScope.ModeratorManageWarnings)) },
        { TwitchSubscriptionTopic.ChannelShieldModeBegin, new("channel.shield_mode.begin", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ModeratorReadShieldMode) || scopes.Contains(TwitchScope.ModeratorManageShieldMode)) },
        { TwitchSubscriptionTopic.ChannelShieldModeEnd, new("channel.shield_mode.end", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ModeratorReadShieldMode) || scopes.Contains(TwitchScope.ModeratorManageShieldMode)) },
        { TwitchSubscriptionTopic.ChannelShoutoutCreate, new("channel.shoutout.create", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ModeratorReadShoutouts) || scopes.Contains(TwitchScope.ModeratorManageShoutouts)) },
        { TwitchSubscriptionTopic.ChannelShoutoutReceive, new("channel.shoutout.receive", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ModeratorReadShoutouts) || scopes.Contains(TwitchScope.ModeratorManageShoutouts)) },
        //{ TwitchSubscriptionTopic.ChannelUnbanRequestCreate, new("channel.unban_request.create", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ModeratorReadUnbanRequests) || scopes.Contains(TwitchScope.ModeratorManageUnbanRequests)) },
        //{ TwitchSubscriptionTopic.ChannelUnbanRequestResolve, new("channel.unban_request.resolve", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ModeratorReadUnbanRequests) || scopes.Contains(TwitchScope.ModeratorManageUnbanRequests)) },
        //{ TwitchSubscriptionTopic.ChannelModerate, new("channel.moderate", "2", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("moderator_user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) =>
        //    (scopes.Contains(TwitchScope.ModeratorReadBlockedTerms) || scopes.Contains(TwitchScope.ModeratorManageBlockedTerms)) &&
        //    (scopes.Contains(TwitchScope.ModeratorReadChatSettings) || scopes.Contains(TwitchScope.ModeratorManageChatSettings)) &&
        //    (scopes.Contains(TwitchScope.ModeratorReadUnbanRequests) || scopes.Contains(TwitchScope.ModeratorManageUnbanRequests)) &&
        //    (scopes.Contains(TwitchScope.ModeratorReadBannedUsers) || scopes.Contains(TwitchScope.ModeratorManageBannedUsers)) &&
        //    (scopes.Contains(TwitchScope.ModeratorReadChatMessages) || scopes.Contains(TwitchScope.ModeratorManageChatMessages)) &&
        //    (scopes.Contains(TwitchScope.ModeratorReadWarnings) || scopes.Contains(TwitchScope.ModeratorManageWarnings)) &&
        //    scopes.Contains(TwitchScope.ModeratorReadModerators) &&
        //    scopes.Contains(TwitchScope.ModeratorReadVips))
        //},

        // Have cost
        { TwitchSubscriptionTopic.ChannelUpdate, new("channel.update", "2", [new("broadcaster_user_id", ConditionArgument.ChannelId)]) },
        { TwitchSubscriptionTopic.ChannelRaidTo, new("channel.raid", "1", [new("to_broadcaster_user_id", ConditionArgument.ChannelId)]) },
        { TwitchSubscriptionTopic.ChannelRaidFrom, new("channel.raid", "1", [new("from_broadcaster_user_id", ConditionArgument.ChannelId)]) },
        //{ TwitchSubscriptionTopic.ChannelSharedChatBegin, new("channel.shared_chat.begin", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)]) },
        //{ TwitchSubscriptionTopic.ChannelSharedChatUpdate, new("channel.shared_chat.update", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)]) },
        //{ TwitchSubscriptionTopic.ChannelSharedChatEnd, new("channel.shared_chat.end", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)]) },
        { TwitchSubscriptionTopic.StreamOnline, new("stream.online", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)]) },
        { TwitchSubscriptionTopic.StreamOffline, new("stream.offline", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)]) },
        { TwitchSubscriptionTopic.UserUpdate, new("user.update", "1", [new("user_id", ConditionArgument.ChannelId)]) },

        // Available to everyone
        //{ TwitchSubscriptionTopic.ChannelChatClear, new("channel.chat.clear", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.UserReadChat)) },
        //{ TwitchSubscriptionTopic.ChannelChatClearUserMessages, new("channel.chat.clear_user_messages", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.UserReadChat)) },
        { TwitchSubscriptionTopic.ChannelChatMessage, new("channel.chat.message", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.UserReadChat)) },
        //{ TwitchSubscriptionTopic.ChannelChatMessageDelete, new("channel.chat.message_delete", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.UserReadChat)) },
        //{ TwitchSubscriptionTopic.ChannelChatNotification, new("channel.chat.notification", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.UserReadChat)) },
        //{ TwitchSubscriptionTopic.ChannelChatSettingsUpdate, new("channel.chat_settings.update", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.UserReadChat)) },
        //{ TwitchSubscriptionTopic.ChannelChatUserMessageHold, new("channel.chat.user_message_hold", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.UserReadChat)) },
        //{ TwitchSubscriptionTopic.ChannelChatUserMessageUpdate, new("channel.chat.user_message_update", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId), new("user_id", ConditionArgument.MyId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.UserReadChat)) },
        { TwitchSubscriptionTopic.ChannelVipAdd, new("channel.vip.add", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ChannelReadVips) || scopes.Contains(TwitchScope.ChannelManageVips)) },
        { TwitchSubscriptionTopic.ChannelVipRemove, new("channel.vip.remove", "1", [new("broadcaster_user_id", ConditionArgument.ChannelId)], (isOwnChannel, scopes) => scopes.Contains(TwitchScope.ChannelReadVips) || scopes.Contains(TwitchScope.ChannelManageVips)) },
};

    private TwitchAPI _api = null!;
    private readonly SemaphoreSlim _apiLock = new(1);
    private EventSubWebsocketClient? _eventSub;
    private bool _disconnectRequested = false;

    private readonly HashSet<TwitchScope> _scopes = [.. data.Configuration.Auth.Scopes];
    private User _me = null!;
    private readonly ConcurrentDictionary<string, User> _usersCache = new(StringComparer.OrdinalIgnoreCase);
    private readonly CancellationTokenSource _cts = new();
    private Task _checkTokenTask = Task.CompletedTask;

    private static async Task<(TwitchAPI API, EventSubWebsocketClient? EventSub)> CreateAsync(INekoLogger logger, TwitchProtocolConfiguration config)
    {
        var proxy = await GetProxyAsync(config.ProxyId);
        var provider = new DefaultClientWebsocketProvider(proxy);

        var api = new TwitchAPI(http: new TwitchHttpClient(new TwitchLogAdapter<TwitchHttpClient>(logger), proxy));
        api.Settings.ClientId = config.Auth.ClientId;

        var eventSub = config.ReceiveEvents ?
            new EventSubWebsocketClient(
                new TwitchLogAdapter<EventSubWebsocketClient>(logger),
                [.. typeof(INotificationHandler)
                    .Assembly.ExportedTypes
                    .Where(x => typeof(INotificationHandler).IsAssignableFrom(x) && !x.IsInterface && !x.IsAbstract)
                    .Select(Activator.CreateInstance).Cast<INotificationHandler>()],
                new WebsocketClientServiceProvider(provider),
                new WebsocketClient(new TwitchLogAdapter<WebsocketClient>(logger), provider)) :
                null;

        return (api, eventSub);
    }

    public override async Task StartAsync()
    {
        (_api, _eventSub) = await CreateAsync(logger, data.Configuration);

        await RefreshTokenAsync();
        _me = (await _api.Helix.Users.GetUsersAsync()).Users.Single();
        _usersCache[_me.Login] = _me;

        _checkTokenTask = Task.Run(async () =>
        {
            while (!_cts.Token.IsCancellationRequested)
            {
                try
                {
                    await WithApi(api => api.Auth.ValidateAccessTokenAsync());
                }
                catch (BadTokenException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(LogCategory, "An error has occured while validating access token", ex);
                }

                try
                {
                    await Task.Delay(TimeSpan.FromHours(1), _cts.Token);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }, _cts.Token);

        if (data.Configuration.ReceiveEvents)
        {
            _eventSub = new EventSubWebsocketClient();

            _eventSub.WebsocketConnected += OnWebsocketConnectedAsync;
            _eventSub.WebsocketDisconnected += OnWebsocketDisconnectedAsync;
            _eventSub.ErrorOccurred += OnErrorOccurredAsync;

            _eventSub.ChannelChatMessage += OnChannelChatMessageAsync;
            _eventSub.UserWhisperMessage += OnUserWhisperMessageAsync;

            await _eventSub.ConnectAsync();
        }
        else
        {
            Connected();
        }
    }

    private async Task OnChannelChatMessageAsync(object sender, ChannelChatMessageArgs args)
    {
        var message = args.Notification.Payload.Event;

        if (message.ChatterUserId == _me.Id)
        {
            return;
        }

        await using var db = NekoDbContext.Get();

        var twitchChat = await db.TwitchChats.SingleOrDefaultAsync(chat => chat.ConnectionId == data.ConnectionId && chat.TwitchId == message.BroadcasterUserId && !chat.IsWhisper) ?? new TwitchChatEntity()
        {
            ConnectionId = data.ConnectionId,
            TwitchId = message.BroadcasterUserId,
            TwitchName = message.BroadcasterUserLogin,
            IsWhisper = false,
        };
        twitchChat.TwitchName = message.BroadcasterUserLogin;
        var chat = new ChatEntity()
        {
            Id = twitchChat.ChatId,
            ConnectionId = data.ConnectionId,
            DisplayName = message.BroadcasterUserName,
            IsPrivate = false,
            Twitch = twitchChat,
        };
        if (twitchChat.Chat is not null)
        {
            db.Entry(twitchChat.Chat).CurrentValues.SetValues(chat);
            chat = twitchChat.Chat;
        }
        else
        {
            db.Chats.Update(chat);
        }

        var twitchBroadcaster = await db.TwitchChatters.SingleOrDefaultAsync(chatter => chatter.ConnectionId == data.ConnectionId && chatter.TwitchId == message.BroadcasterUserId) ?? new TwitchChatterEntity()
        {
            ConnectionId = data.ConnectionId,
            TwitchId = message.BroadcasterUserId,
            TwitchName = message.BroadcasterUserName,
        };
        twitchBroadcaster.TwitchName = message.BroadcasterUserName;
        var broadcaster = new ChatterEntity()
        {
            Id = twitchBroadcaster.ChatterId,
            ConnectionId = data.ConnectionId,
            DisplayName = message.BroadcasterUserName,
            Username = message.BroadcasterUserLogin,
            IsBot = false,
            Twitch = twitchBroadcaster,
        };
        if (twitchBroadcaster.Chatter is not null)
        {
            db.Entry(twitchBroadcaster.Chatter).CurrentValues.SetValues(broadcaster);
            broadcaster = twitchBroadcaster.Chatter;
        }
        else
        {
            db.Chatters.Update(broadcaster);
        }

        var twitchAuthor = message.BroadcasterUserId == message.ChatterUserId ? twitchBroadcaster : await db.TwitchChatters.SingleOrDefaultAsync(chatter => chatter.ConnectionId == data.ConnectionId && chatter.TwitchId == message.ChatterUserId) ?? new TwitchChatterEntity()
        {
            ConnectionId = data.ConnectionId,
            TwitchId = message.ChatterUserId,
            TwitchName = message.ChatterUserName,
        };
        twitchAuthor.TwitchName = message.ChatterUserName;
        var author = new ChatterEntity()
        {
            Id = twitchAuthor.ChatterId,
            ConnectionId = data.ConnectionId,
            DisplayName = message.ChatterUserName,
            Username = message.ChatterUserLogin,
            IsBot = message.Badges.Any(badge => badge.SetId.Equals("bot", StringComparison.OrdinalIgnoreCase)),
            Twitch = twitchAuthor,
        };
        if (twitchAuthor.Chatter is not null)
        {
            db.Entry(twitchAuthor.Chatter).CurrentValues.SetValues(author);
            author = twitchAuthor.Chatter;
        }
        else
        {
            db.Chatters.Update(author);
        }

        var twitchChatMessage = await db.TwitchChatMessages.SingleOrDefaultAsync(chatMessage =>
            chatMessage.ConnectionId == data.ConnectionId &&
            chatMessage.TwitchChatId == message.BroadcasterUserId &&
            chatMessage.TwitchId == message.MessageId &&
            !chatMessage.IsWhisper) ?? new TwitchChatMessageEntity()
        {
            ConnectionId = data.ConnectionId,
            TwitchChatId = message.BroadcasterUserId,
            TwitchId = message.MessageId,
            IsWhisper = false,
        };
        var msg = new ChatMessageEntity()
        {
            Id = twitchChatMessage.ChatMessageId,
            ConnectionId = data.ConnectionId,
            RemoteTimestamp = args.Notification.Metadata.MessageTimestamp,
            Chat = chat,
            Author = author,
            TextContent = message.Message.Text,
            IsSpecial = false,
            IsDirect = message.Message.Fragments.Any(fragment => fragment.Type.Equals("mention", StringComparison.OrdinalIgnoreCase) && fragment.Mention?.UserId == _me.Id) || message.Reply?.ParentUserId == _me.Id,
            IsOffline = false,
            ReplyToId = message.Reply is null ? null : (await db.TwitchChatMessages.SingleOrDefaultAsync(chatMessage =>
                chatMessage.ConnectionId == data.ConnectionId &&
                chatMessage.TwitchChatId == message.BroadcasterUserId &&
                chatMessage.TwitchId == message.Reply.ParentMessageId &&
                !chatMessage.IsWhisper))?.Id,
            Twitch = twitchChatMessage,
        };
        if (twitchChatMessage.ChatMessage is not null)
        {
            db.Entry(twitchChatMessage.ChatMessage).CurrentValues.SetValues(msg);
            msg = twitchChatMessage.ChatMessage;
        }
        else
        {
            db.ChatMessages.Update(msg);
        }

        await db.SaveChangesAsync();

        var msgBinding = new ChatMessageBinding(data.Owner)
        {
            id = msg.Id,
            protocol = ProtocolId,
            connectionId = data.ConnectionId,
            timestamp = msg.RemoteTimestamp,
            attachments = [],
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
                raw = new TwitchChatBinding(message),
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
                raw = new TwitchChatterBinding(message),
            },
            text = msg.TextContent,
            replyToId = msg.ReplyToId,
            flags = new ChatMessageFlags()
            {
                isSpecial = msg.IsSpecial,
                isDirect = msg.IsDirect,
                isOffline = msg.IsOffline,
            },
            raw = new TwitchChatMessageBinding(message),
        };

        MessageReceived(msg, msgBinding);
    }

    private async Task OnUserWhisperMessageAsync(object sender, UserWhisperMessageArgs args)
    {
        var message = args.Notification.Payload.Event;

        if (message.FromUserId == _me.Id)
        {
            return;
        }

        await using var db = NekoDbContext.Get();

        var twitchChat = await db.TwitchChats.SingleOrDefaultAsync(chat => chat.ConnectionId == data.ConnectionId && chat.TwitchId == message.FromUserId && chat.IsWhisper) ?? new TwitchChatEntity()
        {
            ConnectionId = data.ConnectionId,
            TwitchId = message.FromUserId,
            TwitchName = message.FromUserLogin,
            IsWhisper = true,
        };
        twitchChat.TwitchName = message.FromUserName;
        var chat = new ChatEntity()
        {
            Id = twitchChat.ChatId,
            ConnectionId = data.ConnectionId,
            DisplayName = message.FromUserName,
            IsPrivate = true,
            Twitch = twitchChat,
        };
        if (twitchChat.Chat is not null)
        {
            db.Entry(twitchChat.Chat).CurrentValues.SetValues(chat);
            chat = twitchChat.Chat;
        }
        else
        {
            db.Chats.Update(chat);
        }

        var twitchAuthor = await db.TwitchChatters.SingleOrDefaultAsync(chatter => chatter.ConnectionId == data.ConnectionId && chatter.TwitchId == message.FromUserId) ?? new TwitchChatterEntity()
        {
            ConnectionId = data.ConnectionId,
            TwitchId = message.FromUserId,
            TwitchName = message.FromUserName,
        };
        twitchAuthor.TwitchName = message.FromUserName;
        var author = new ChatterEntity()
        {
            Id = twitchAuthor.ChatterId,
            ConnectionId = data.ConnectionId,
            DisplayName = message.FromUserName,
            Username = message.FromUserLogin,
            IsBot = twitchAuthor.Chatter?.IsBot ?? false,
            Twitch = twitchAuthor,
        };
        if (twitchAuthor.Chatter is not null)
        {
            db.Entry(twitchAuthor.Chatter).CurrentValues.SetValues(author);
            author = twitchAuthor.Chatter;
        }
        else
        {
            db.Chatters.Update(author);
        }

        var twitchChatMessage = await db.TwitchChatMessages.SingleOrDefaultAsync(chatMessage =>
            chatMessage.ConnectionId == data.ConnectionId &&
            chatMessage.TwitchChatId == message.FromUserId &&
            chatMessage.TwitchId == message.WhisperId &&
            chatMessage.IsWhisper) ?? new TwitchChatMessageEntity()
        {
            ConnectionId = data.ConnectionId,
            TwitchChatId = message.FromUserId,
            TwitchId = message.WhisperId,
            IsWhisper = true,
        };
        var msg = new ChatMessageEntity()
        {
            Id = twitchChatMessage.ChatMessageId,
            ConnectionId = data.ConnectionId,
            RemoteTimestamp = args.Notification.Metadata.MessageTimestamp,
            Chat = chat,
            ChatId = chat.Id,
            Author = author,
            AuthorId = author.Id,
            TextContent = message.Whisper.Text,
            IsSpecial = false,
            IsDirect = true,
            IsOffline = false,
            ReplyToId = null,
            Twitch = twitchChatMessage,
        };
        if (twitchChatMessage.ChatMessage is not null)
        {
            db.Entry(twitchChatMessage.ChatMessage).CurrentValues.SetValues(msg);
            msg = twitchChatMessage.ChatMessage;
        }
        else
        {
            db.ChatMessages.Update(msg);
        }

        await db.SaveChangesAsync();

        var msgBinding = new ChatMessageBinding(data.Owner)
        {
            id = msg.Id,
            protocol = ProtocolId,
            connectionId = data.ConnectionId,
            timestamp = msg.RemoteTimestamp,
            attachments = [],
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
                raw = new TwitchChatBinding(message),
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
                raw = new TwitchChatterBinding(message),
            },
            text = msg.TextContent,
            replyToId = null,
            flags = new ChatMessageFlags()
            {
                isSpecial = msg.IsSpecial,
                isDirect = msg.IsDirect,
                isOffline = msg.IsOffline,
            },
            raw = new TwitchChatMessageBinding(message),
        };

        MessageReceived(msg, msgBinding);
    }

    [SuppressMessage("Style", "VSTHRD200:Use \"Async\" suffix for async methods")]
    private async Task<T> WithApi<T>(Func<TwitchAPI, Task<T>> f)
    {
        await _apiLock.WaitAsync();
        try
        {
            try
            {
                return await f(_api);
            }
            catch (TokenExpiredException)
            {
                await RefreshTokenAsync();
                return await f(_api);
            }
        }
        catch (BadTokenException ex)
        {
            logger.LogError(LogCategory, "Invalid access token", ex);
            Die(ex);
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(LogCategory, "Error during API call", ex);
            throw;
        }
        finally
        {
            _apiLock.Release();
        }
    }

    [SuppressMessage("Style", "VSTHRD200:Use \"Async\" suffix for async methods")]
    private async Task WithApi(Func<TwitchAPI, Task> f)
    {
        await WithApi<object?>(async api =>
        {
            await f(api);
            return null;
        });
    }

    private async Task<Dictionary<string, User>> GetUsersInfoAsync(IEnumerable<string> logins)
    {
        var loaded = new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase);
        var toLoad = new List<string>();
        foreach (var user in logins)
        {
            if (_usersCache.TryGetValue(user, out var cachedUser))
            {
                loaded[user] = cachedUser;
            }
            else
            {
                toLoad.Add(user);
            }
        }

        if (toLoad.Count > 0)
        {
            var users = await _api.Helix.Users.GetUsersAsync(logins: toLoad);
            foreach (var user in users.Users)
            {
                loaded[user.Login] = _usersCache[user.Id] = user;
            }
        }

        return loaded;
    }

    private async Task<CreateEventSubSubscriptionResponse?> SubscribeToTopicAsync(string topic, string version, params KeyValuePair<string, string>[] condition)
    {
        var topicName = $"{topic}({string.Join(", ", condition.Select(x => $"{x.Key}: {x.Value}"))})";

        try
        {
            var result = await WithApi(api => api.Helix.EventSub.CreateEventSubSubscriptionAsync(topic, version, condition.ToDictionary(), EventSubTransportMethod.Websocket, websocketSessionId: _eventSub!.SessionId));
            var sub = result.Subscriptions[0];
            logger.LogVerbose(LogCategory, $"Subscribed to {topicName} (cost: {sub.Cost}, available: {result.MaxTotalCost - result.TotalCost})");
            return result;
        }
        catch (Exception ex)
        {
            logger.LogWarning(LogCategory, $"Failed to subscribe to {topicName}", ex);
            return null;
        }
    }

    private async Task OnWebsocketConnectedAsync(object sender, WebsocketConnectedArgs args)
    {
        logger.LogVerbose(LogCategory, $"WebSocket {_eventSub!.SessionId} connected");

        try
        {
            if (!args.IsRequestedReconnect)
            {
                var channels = await GetUsersInfoAsync(data.Configuration.Channels.Select(channel => channel.Name));

                foreach (var channel in data.Configuration.Channels)
                {
                    if (!channels.TryGetValue(channel.Name, out var channelInfo))
                    {
                        logger.LogWarning(LogCategory, $"Unable to get channel information for '{channel.Name}'");
                        continue;
                    }

                    foreach (var topic in channel.EventSubscriptions)
                    {
                        var subscription = _subscriptionTypes[topic];
                        if (subscription.Predicate?.Invoke(channelInfo.Id == _me.Id, _scopes) ?? true)
                        {
                            await SubscribeToTopicAsync(subscription.TopicName, subscription.Version, [.. subscription.Condition.Select(x => new KeyValuePair<string, string>(x.Key, x.Value == ConditionArgument.ChannelId ? channelInfo.Id : _me.Id))]);
                        }
                    }
                }

                Connected();
            }
        }
        catch (Exception ex)
        {
            Die(ex);
        }
    }

    private Task OnWebsocketDisconnectedAsync(object sender, EventArgs args)
    {
        logger.LogVerbose(LogCategory, $"WebSocket {_eventSub!.SessionId} disconnected");
        if (!_disconnectRequested)
        {
            RequestRestart();
        }
        return Task.CompletedTask;
    }

    private Task OnErrorOccurredAsync(object sender, ErrorOccuredArgs args)
    {
        logger.LogWarning(LogCategory, $"An error has occured: {args.Message}", args.Exception);
        return Task.CompletedTask;
    }

    private async Task RefreshTokenAsync()
    {
        await using var db = NekoDbContext.Get();
        var connection = await db.Connections.SingleAsync(connection => connection.Id == data.ConnectionId);
        var extra = (TwitchExtraProtocolData?)connection.Extra;

        if (extra is not null && (extra.StartingAccessToken != data.Configuration.Auth.AccessToken || extra.StartingRefreshToken != data.Configuration.Auth.RefreshToken))
        {
            extra = null;
        }

        var result = await _api.Auth.RefreshAuthTokenAsync(extra?.CurrentRefreshToken ?? data.Configuration.Auth.RefreshToken);
        _api.Settings.AccessToken = result.AccessToken;

        connection.Extra = new TwitchExtraProtocolData(data.Configuration.Auth.AccessToken, data.Configuration.Auth.RefreshToken, result.AccessToken, result.RefreshToken);

        await db.SaveChangesAsync();

        logger.LogInfo(LogCategory, "Refreshed access token!");
    }

    public override async Task HandleMessageAsync(IActorRef sender, IConnectionsMessage message)
    {
        switch (message)
        {
            case IConnectionsMessage.ProxyUpdated proxyUpdated:
                {
                    if (data.Configuration.ProxyId is not null && long.Parse(data.Configuration.ProxyId) == proxyUpdated.Id)
                    {
                        RequestRestart();
                    }
                    break;
                }

            case IConnectionsMessage.SimpleReply simpleReply:
                {
                    if (simpleReply.ReplyTo.raw is TwitchChatMessageBinding twitchMessage)
                    {
                        switch (twitchMessage.Message)
                        {
                            case ChannelChatMessage channelMessage:
                                await WithApi(api => api.Helix.Chat.SendChatMessage(channelMessage.BroadcasterUserId, _me.Id, simpleReply.Text, channelMessage.MessageId));
                                break;

                            case UserWhisperMessage whisperMessage:
                                await WithApi(api => api.Helix.Whispers.SendWhisperAsync(_me.Id, whisperMessage.FromUserId, simpleReply.Text, false));
                                break;
                        }
                    }
                    else
                    {
                        throw new InvalidOperationException("Invalid send target");
                    }
                    break;
                }

            case IConnectionsMessage.SendMessage sendMessage:
                {
                    if (sendMessage.Chat.raw is TwitchChatBinding twitchChat)
                    {
                        switch (twitchChat.Message)
                        {
                            case ChannelChatMessage channelMessage:
                                await WithApi(api => api.Helix.Chat.SendChatMessage(channelMessage.BroadcasterUserId, _me.Id, sendMessage.Text));
                                break;

                            case UserWhisperMessage whisperMessage:
                                await WithApi(api => api.Helix.Whispers.SendWhisperAsync(_me.Id, whisperMessage.FromUserId, sendMessage.Text, true));
                                break;
                        }
                    }
                    else
                    {
                        throw new InvalidOperationException("Invalid send target");
                    }
                    break;
                }
        }
    }

    public static async Task<object?> TestAsync(IServiceProvider _, TwitchProtocolConfiguration config, CancellationToken __)
    {
        var log = new LogRouter(LogSourceType.System, "");
        var (api, _) = await CreateAsync(log, config with { ReceiveEvents = false });
        api.Settings.AccessToken = config.Auth.AccessToken;

        var me = (await api.Helix.Users.GetUsersAsync()).Users.Single();

        return new
        {
            User = new
            {
                me.Id,
                me.Login,
                me.DisplayName,
                me.CreatedAt,
                me.Type,
                me.BroadcasterType,
                me.ProfileImageUrl,
                me.OfflineImageUrl,
                me.Email,
            },
            Log = log.Buffer.GetAll().Select(msg => new
            {
                msg.Severity,
                msg.Category,
                msg.Message,
                Exception = msg.Exception?.Message,
            })
        };
    }

    public override async ValueTask DisposeAsync()
    {
        await _cts.CancelAsync();
#pragma warning disable VSTHRD003 // Avoid awaiting foreign Tasks
        await _checkTokenTask;
#pragma warning restore VSTHRD003 // Avoid awaiting foreign Tasks
        _cts.Dispose();

        _disconnectRequested = true;

        if (_eventSub is not null)
        {
            await _eventSub.DisconnectAsync();
        }
    }
}
