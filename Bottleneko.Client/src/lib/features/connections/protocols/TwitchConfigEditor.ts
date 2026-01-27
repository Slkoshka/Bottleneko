import {
    TwitchScopeValues,
    TwitchSubscriptionTopicValues,
    type TwitchProtocolChannel,
    type TwitchScope,
    type TwitchSubscriptionTopic,
} from '$lib/api/bottleneko.gen';
import * as yup from 'yup';

export const TwitchAuthSchema = yup.object().shape({
    clientId: yup.string().default('').required('Client ID is required'),
    me: yup.string().default('').required(),
    accessToken: yup.string().default(''),
    refreshToken: yup.string().default(''),
    scopes: yup.array().of(yup.mixed<TwitchScope>().oneOf(TwitchScopeValues).required()).default([]),
});

export const TwitchProtocolChannelSchema = yup.object().shape({
    name: yup.string().default('').required('Channel name is required'),
    eventSubscriptions: yup
        .array()
        .of(yup.mixed<TwitchSubscriptionTopic>().oneOf(TwitchSubscriptionTopicValues).required())
        .default(['ChannelChatMessage'])
        .required(),
});

export const TwitchConfigSchema = yup
    .object()
    .noUnknown()
    .shape({
        $type: yup.string().oneOf(['Twitch']).default('Twitch'),
        receiveEvents: yup.boolean().default(true),
        channels: yup.array().of(TwitchProtocolChannelSchema).max(100).default([]).required(),
        auth: TwitchAuthSchema.required(),
        proxyId: yup.string().nullable().default(''),
    });

export const FormSchema = yup.object().shape({
    name: yup.string().default('').required('Name should not be empty'),
    config: TwitchConfigSchema.required(),
});

export const MAX_SUBS = 300;
export const MAX_COST = 10;

export const countSubs = (channels: TwitchProtocolChannel[]) =>
    channels.reduce((prev, cur) => prev + cur.eventSubscriptions.length, 0);
export const countCost = (me: string, channels: TwitchProtocolChannel[]) =>
    channels.reduce(
        (prev, cur) =>
            prev +
            (cur.name.toLowerCase() === me.toLowerCase()
                ? 0
                : cur.eventSubscriptions.map((s) => topicsInfo.get(s)?.cost ?? 0).reduce((prev, cur) => prev + cur)),
        0,
    );

export const scopeNameToScope: Record<string, TwitchScope> = {
    'analytics:read:extensions': 'AnalyticsReadExtensions',
    'analytics:read:games': 'AnalyticsReadGames',
    'bits:read': 'BitsRead',
    'channel:bot': 'ChannelBot', // only needed for connections using app access tokens (we don't)
    'channel:edit:commercial': 'ChannelEditCommercial',
    'channel:manage:ads': 'ChannelManageAds',
    'channel:manage:broadcast': 'ChannelManageBroadcast',
    'channel:manage:extensions': 'ChannelManageExtensions',
    'channel:manage:guest_star': 'ChannelManageGuestStar',
    'channel:manage:moderators': 'ChannelManageModerators',
    'channel:manage:polls': 'ChannelManagePolls',
    'channel:manage:predictions': 'ChannelManagePredictions',
    'channel:manage:raids': 'ChannelManageRaids',
    'channel:manage:redemptions': 'ChannelManageRedemptions',
    'channel:manage:schedule': 'ChannelManageSchedule',
    'channel:manage:videos': 'ChannelManageVideos',
    'channel:manage:vips': 'ChannelManageVips',
    'channel:moderate': 'ChannelModerate',
    'channel:read:ads': 'ChannelReadAds',
    'channel:read:charity': 'ChannelReadCharity',
    'channel:read:editors': 'ChannelReadEditors',
    'channel:read:goals': 'ChannelReadGoals',
    'channel:read:guest_star': 'ChannelReadGuestStar',
    'channel:read:hype_train': 'ChannelReadHypeTrain',
    'channel:read:polls': 'ChannelReadPolls',
    'channel:read:predictions': 'ChannelReadPredictions',
    'channel:read:redemptions': 'ChannelReadRedemptions',
    'channel:read:stream_key': 'ChannelReadStreamKey',
    'channel:read:subscriptions': 'ChannelReadSubscriptions',
    'channel:read:vips': 'ChannelReadVips',
    'clips:edit': 'ClipsEdit',
    'moderation:read': 'ModerationRead',
    'moderator:manage:announcements': 'ModeratorManageAnnouncements',
    'moderator:manage:automod': 'ModeratorManageAutomod',
    'moderator:manage:automod_settings': 'ModeratorManageAutomodSettings',
    'moderator:manage:banned_users': 'ModeratorManageBannedUsers',
    'moderator:manage:blocked_terms': 'ModeratorManageBlockedTerms',
    'moderator:manage:chat_messages': 'ModeratorManageChatMessages',
    'moderator:manage:chat_settings': 'ModeratorManageChatSettings',
    'moderator:manage:guest_star': 'ModeratorManageGuestStar',
    'moderator:manage:shield_mode': 'ModeratorManageShieldMode',
    'moderator:manage:shoutouts': 'ModeratorManageShoutouts',
    'moderator:manage:unban_requests': 'ModeratorManageUnbanRequests',
    'moderator:manage:warnings': 'ModeratorManageWarnings',
    'moderator:read:automod_settings': 'ModeratorReadAutomodSettings',
    'moderator:read:banned_users': 'ModeratorReadBannedUsers',
    'moderator:read:blocked_terms': 'ModeratorReadBlockedTerms',
    'moderator:read:chat_messages': 'ModeratorReadChatMessages',
    'moderator:read:chat_settings': 'ModeratorReadChatSettings',
    'moderator:read:chatters': 'ModeratorReadChatters',
    'moderator:read:followers': 'ModeratorReadFollowers',
    'moderator:read:guest_star': 'ModeratorReadGuestStar',
    'moderator:read:moderators': 'ModeratorReadModerators',
    'moderator:read:shield_mode': 'ModeratorReadShieldMode',
    'moderator:read:shoutouts': 'ModeratorReadShoutouts',
    'moderator:read:suspicious_users': 'ModeratorReadSuspiciousUsers',
    'moderator:read:unban_requests': 'ModeratorReadUnbanRequests',
    'moderator:read:vips': 'ModeratorReadVips',
    'moderator:read:warnings': 'ModeratorReadWarnings',
    'user:bot': 'UserBot', // only needed if we use app access tokens
    'user:edit': 'UserEdit',
    'user:edit:broadcast': 'UserEditBroadcast',
    'user:manage:blocked_users': 'UserManageBlockedUsers',
    'user:manage:chat_color': 'UserManageChatColor',
    'user:manage:whispers': 'UserManageWhispers',
    'user:read:blocked_users': 'UserReadBlockedUsers',
    'user:read:broadcast': 'UserReadBroadcast',
    'user:read:chat': 'UserReadChat',
    'user:read:email': 'UserReadEmail',
    'user:read:emotes': 'UserReadEmotes',
    'user:read:follows': 'UserReadFollows',
    'user:read:moderated_channels': 'UserReadModeratedChannels',
    'user:read:subscriptions': 'UserReadSubscriptions',
    'user:read:whispers': 'UserReadWhispers',
    'user:write:chat': 'UserWriteChat',
};

export const scopeToScopeName = new Map<TwitchScope, string>();
for (const [key, value] of Object.entries(scopeNameToScope)) {
    scopeToScopeName.set(value, key);
}

export const moderateScopes: TwitchScope[] = [
    'ChannelModerate',
    'ModerationRead',
    'ModeratorManageAnnouncements',
    'ModeratorManageAutomod',
    'ModeratorManageAutomodSettings',
    'ModeratorManageBannedUsers',
    'ModeratorManageBlockedTerms',
    'ModeratorManageChatMessages',
    'ModeratorManageChatSettings',
    'ModeratorManageGuestStar',
    'ModeratorManageShieldMode',
    'ModeratorManageShoutouts',
    'ModeratorManageUnbanRequests',
    'ModeratorManageWarnings',
    'ModeratorReadAutomodSettings',
    'ModeratorReadBannedUsers',
    'ModeratorReadBlockedTerms',
    'ModeratorReadChatMessages',
    'ModeratorReadChatSettings',
    'ModeratorReadChatters',
    'ModeratorReadFollowers',
    'ModeratorReadGuestStar',
    'ModeratorReadModerators',
    'ModeratorReadShieldMode',
    'ModeratorReadShoutouts',
    'ModeratorReadSuspiciousUsers',
    'ModeratorReadUnbanRequests',
    'ModeratorReadVips',
    'ModeratorReadWarnings',
];

export const viewChannelInfoScopes: TwitchScope[] = [
    'BitsRead',
    'ChannelReadAds',
    'ChannelReadCharity',
    'ChannelReadEditors',
    'ChannelReadGoals',
    'ChannelReadGuestStar',
    'ChannelReadHypeTrain',
    'ChannelReadPolls',
    'ChannelReadPredictions',
    'ChannelReadRedemptions',
    'ChannelReadStreamKey',
    'ChannelReadSubscriptions',
    'ChannelReadVips',
];

export const editChannelInfoScopes: TwitchScope[] = [
    'ChannelEditCommercial',
    'ChannelManageAds',
    'ChannelManageBroadcast',
    'ChannelManageExtensions',
    'ChannelManageGuestStar',
    'ChannelManageModerators',
    'ChannelManagePolls',
    'ChannelManagePredictions',
    'ChannelManageRaids',
    'ChannelManageRedemptions',
    'ChannelManageSchedule',
    'ChannelManageVideos',
    'ChannelManageVips',
];

export const createClipsScopes: TwitchScope[] = ['ClipsEdit'];

export const viewUserInfoScopes: TwitchScope[] = [
    'UserReadBlockedUsers',
    'UserReadBroadcast',
    'UserReadEmail',
    'UserReadEmotes',
    'UserReadFollows',
    'UserReadModeratedChannels',
    'UserReadSubscriptions',
];

export const editUserInfoScopes: TwitchScope[] = [
    'UserEdit',
    'UserEditBroadcast',
    'UserManageBlockedUsers',
    'UserManageChatColor',
];

export const chatScopes: TwitchScope[] = ['UserReadChat', 'UserWriteChat'];

export const whispersScopes: TwitchScope[] = ['UserReadWhispers', 'UserManageWhispers'];

export interface TwitchSubscriptionTopicInfo {
    name: string;
    description: string;
    target: 'self' | 'mod' | 'any';
    cost: number;
    infoUrl: string;
}

const makeTopic = (
    name: string,
    description: string,
    target: 'self' | 'mod' | 'any',
    cost: number,
    infoUrl: string,
) => {
    return { name, description, target, cost, infoUrl };
};

export const topicsInfo = new Map<TwitchSubscriptionTopic, TwitchSubscriptionTopicInfo>();

// Only available on the user's channel
// info.set('ChannelBitsUse', make('channel.bits.use', 'A notification is sent whenever Bits are used on a channel. Requires <code>bits:read</code> scope.', 'self', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelbitsuse'));
topicsInfo.set(
    'ChannelCheer',
    makeTopic(
        'channel.cheer',
        'A notification is sent whenever Bits are used on the specified channel. Requires <code>bits:read</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcheer',
    ),
);
topicsInfo.set(
    'ChannelAdBreakBegin',
    makeTopic(
        'channel.ad_break.begin',
        'A midroll commercial break has started running. Requires <code>channel:read:ads</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelad_breakbegin',
    ),
);
topicsInfo.set(
    'ChannelBan',
    makeTopic(
        'channel.ban',
        'A viewer is banned from the specified channel. Requires <code>channel:moderate</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelban',
    ),
);
topicsInfo.set(
    'ChannelUnban',
    makeTopic(
        'channel.unban',
        'A viewer is unbanned from the specified channel. Requires <code>channel:moderate</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban',
    ),
);
topicsInfo.set(
    'ChannelCharityCampaignDonate',
    makeTopic(
        'channel.charity_campaign.donate',
        'Sends an event notification when a user donates to the broadcaster’s charity campaign. Requires <code>channel:read:charity</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaigndonate',
    ),
);
topicsInfo.set(
    'ChannelCharityCampaignStart',
    makeTopic(
        'channel.charity_campaign.start',
        'Sends an event notification when the broadcaster starts a charity campaign. Requires <code>channel:read:charity</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstart',
    ),
);
topicsInfo.set(
    'ChannelCharityCampaignProgress',
    makeTopic(
        'channel.charity_campaign.progress',
        'Sends an event notification when progress is made towards the campaign’s goal or when the broadcaster changes the fundraising goal. Requires <code>channel:read:charity</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignprogress',
    ),
);
topicsInfo.set(
    'ChannelCharityCampaignStop',
    makeTopic(
        'channel.charity_campaign.stop',
        'Sends an event notification when the broadcaster stops a charity campaign. Requires <code>channel:read:charity</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcharity_campaignstop',
    ),
);
topicsInfo.set(
    'ChannelHypeTrainBegin',
    makeTopic(
        'channel.hype_train.begin',
        'A Hype Train begins on the specified channel. Requires <code>channel:read:hype_train</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainbegin',
    ),
);
topicsInfo.set(
    'ChannelHypeTrainProgress',
    makeTopic(
        'channel.hype_train.progress',
        'A Hype Train makes progress on the specified channel. Requires <code>channel:read:hype_train</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainprogress',
    ),
);
topicsInfo.set(
    'ChannelHypeTrainEnd',
    makeTopic(
        'channel.hype_train.end',
        'A Hype Train ends on the specified channel. Requires <code>channel:read:hype_train</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelhype_trainend',
    ),
);
topicsInfo.set(
    'ChannelGoalBegin',
    makeTopic(
        'channel.goal.begin',
        'Get notified when the broadcaster begins a goal. Requires <code>channel:read:goals</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalbegin',
    ),
);
topicsInfo.set(
    'ChannelGoalProgress',
    makeTopic(
        'channel.goal.progress',
        'Get notified when progress (either positive or negative) is made towards a broadcaster’s goal. Requires <code>channel:read:goals</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalprogress',
    ),
);
topicsInfo.set(
    'ChannelGoalEnd',
    makeTopic(
        'channel.goal.end',
        'Get notified when a broadcaster ends a goal. Requires <code>channel:read:goals</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelgoalend',
    ),
);
topicsInfo.set(
    'ChannelModeratorAdd',
    makeTopic(
        'channel.moderator.add',
        'Moderator privileges were added to a user on the specified channel. Requires <code>moderation:read</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatoradd',
    ),
);
topicsInfo.set(
    'ChannelModeratorRemove',
    makeTopic(
        'channel.moderator.remove',
        'Moderator privileges were removed from a user on the specified channel. Requires <code>moderation:read</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderatorremove',
    ),
);
// info.set('ChannelChannelPointsAutomaticRewardRedemptionAdd', make('channel.channel_points_automatic_reward_redemption.add', 'A viewer has redeemed an automatic channel points reward on the specified channel. Requires <code>channel:read:redemptions</code> or <code>channel:manage:redemptions</code> scopes.', 'self', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_automatic_reward_redemptionadd'));
topicsInfo.set(
    'ChannelChannelPointsCustomRewardAdd',
    makeTopic(
        'channel.channel_points_custom_reward.add',
        'A custom channel points reward has been created for the specified channel. Requires <code>channel:read:redemptions</code> or <code>channel:manage:redemptions</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardadd',
    ),
);
topicsInfo.set(
    'ChannelChannelPointsCustomRewardUpdate',
    makeTopic(
        'channel.channel_points_custom_reward.update',
        'A custom channel points reward has been updated for the specified channel. Requires <code>channel:read:redemptions</code> or <code>channel:manage:redemptions</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardupdate',
    ),
);
topicsInfo.set(
    'ChannelChannelPointsCustomRewardRemove',
    makeTopic(
        'channel.channel_points_custom_reward.remove',
        'A custom channel points reward has been removed from the specified channel. Requires <code>channel:read:redemptions</code> or <code>channel:manage:redemptions</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_rewardremove',
    ),
);
topicsInfo.set(
    'ChannelChannelPointsCustomRewardRedemptionAdd',
    makeTopic(
        'channel.channel_points_custom_reward_redemption.add',
        'A viewer has redeemed a custom channel points reward on the specified channel. Requires <code>channel:read:redemptions</code> or <code>channel:manage:redemptions</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionadd',
    ),
);
topicsInfo.set(
    'ChannelChannelPointsCustomRewardRedemptionUpdate',
    makeTopic(
        'channel.channel_points_custom_reward_redemption.update',
        'A redemption of a channel points custom reward has been updated for the specified channel. Requires <code>channel:read:redemptions</code> or <code>channel:manage:redemptions</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionupdate',
    ),
);
topicsInfo.set(
    'ChannelPollBegin',
    makeTopic(
        'channel.poll.begin',
        'A poll started on the specified channel. Requires <code>channel:read:polls</code> or <code>channel:manage:polls</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollbegin',
    ),
);
topicsInfo.set(
    'ChannelPollProgress',
    makeTopic(
        'channel.poll.progress',
        'Users respond to a poll on the specified channel. Requires <code>channel:read:polls</code> or <code>channel:manage:polls</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollprogress',
    ),
);
topicsInfo.set(
    'ChannelPollEnd',
    makeTopic(
        'channel.poll.end',
        'A poll ended on the specified channel. Requires <code>channel:read:polls</code> or <code>channel:manage:polls</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpollend',
    ),
);
topicsInfo.set(
    'ChannelPredictionBegin',
    makeTopic(
        'channel.prediction.begin',
        'A Prediction started on the specified channel. Requires <code>channel:read:predictions</code> or <code>channel:manage:predictions</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionbegin',
    ),
);
topicsInfo.set(
    'ChannelPredictionProgress',
    makeTopic(
        'channel.prediction.progress',
        'Users participated in a Prediction on the specified channel. Requires <code>channel:read:predictions</code> or <code>channel:manage:predictions</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionprogress',
    ),
);
topicsInfo.set(
    'ChannelPredictionLock',
    makeTopic(
        'channel.prediction.lock',
        'A Prediction was locked on the specified channel. Requires <code>channel:read:predictions</code> or <code>channel:manage:predictions</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionlock',
    ),
);
topicsInfo.set(
    'ChannelPredictionEnd',
    makeTopic(
        'channel.prediction.end',
        'A Prediction ended on the specified channel. Requires <code>channel:read:predictions</code> or <code>channel:manage:predictions</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelpredictionend',
    ),
);
topicsInfo.set(
    'ChannelSubscribe',
    makeTopic(
        'channel.subscribe',
        'A notification is sent when the specified channel receives a subscriber. This does not include resubscribes. Requires <code>channel:read:subscriptions</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe',
    ),
);
topicsInfo.set(
    'ChannelSubscriptionEnd',
    makeTopic(
        'channel.subscription.end',
        'A notification when a subscription to the specified channel ends. Requires <code>channel:read:subscriptions</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionend',
    ),
);
topicsInfo.set(
    'ChannelSubscriptionGift',
    makeTopic(
        'channel.subscription.gift',
        'A notification when a viewer gives a gift subscription to one or more users in the specified channel. Requires <code>channel:read:subscriptions</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptiongift',
    ),
);
topicsInfo.set(
    'ChannelSubscriptionMessage',
    makeTopic(
        'channel.subscription.message',
        'A notification when a user sends a resubscription chat message in the specific channel. Requires <code>channel:read:subscriptions</code> scope.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionmessage',
    ),
);
topicsInfo.set(
    'UserWhisperMessage',
    makeTopic(
        'user.whisper.message',
        'The user receives a whisper. Requires <code>user:read:whispers</code> or <code>user:manage:whispers</code> scopes.',
        'self',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userwhispermessage',
    ),
);

// Require the user to be a mod
topicsInfo.set(
    'ChannelFollow',
    makeTopic(
        'channel.follow',
        'The specified channel receives a follow. Requires <code>moderator:read:followers</code> scope.',
        'mod',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelfollow',
    ),
);
topicsInfo.set(
    'ChannelSuspiciousUserUpdate',
    makeTopic(
        'channel.suspicious_user.update',
        'A suspicious user has been updated. Requires <code>moderator:read:suspicious_users</code> scope.',
        'mod',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_userupdate',
    ),
);
topicsInfo.set(
    'ChannelSuspiciousUserMessage',
    makeTopic(
        'channel.suspicious_user.message',
        'A chat message has been sent by a suspicious user. Requires <code>moderator:read:suspicious_users</code> scope.',
        'mod',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsuspicious_usermessage',
    ),
);
topicsInfo.set(
    'ChannelWarningAcknowledge',
    makeTopic(
        'channel.warning.acknowledge',
        'A user awknowledges a warning. Broadcasters and moderators can see the warning’s details. Requires <code>moderator:read:warnings</code> or <code>moderator:manage:warnings</code> scopes.',
        'mod',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningacknowledge',
    ),
);
topicsInfo.set(
    'ChannelWarningSend',
    makeTopic(
        'channel.warning.send',
        'A user is sent a warning. Broadcasters and moderators can see the warning’s details. Requires <code>moderator:read:warnings</code> or <code>moderator:manage:warnings</code> scopes.',
        'mod',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelwarningsend',
    ),
);
topicsInfo.set(
    'ChannelShieldModeBegin',
    makeTopic(
        'channel.shield_mode.begin',
        'Sends a notification when the broadcaster activates Shield Mode. Requires <code>moderator:read:shield_mode</code> or <code>moderator:manage:shield_mode</code> scopes.',
        'mod',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modebegin',
    ),
);
topicsInfo.set(
    'ChannelShieldModeEnd',
    makeTopic(
        'channel.shield_mode.end',
        'Sends a notification when the broadcaster deactivates Shield Mode. Requires <code>moderator:read:shield_mode</code> or <code>moderator:manage:shield_mode</code> scopes.',
        'mod',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshield_modeend',
    ),
);
topicsInfo.set(
    'ChannelShoutoutCreate',
    makeTopic(
        'channel.shoutout.create',
        'Sends a notification when the specified broadcaster sends a Shoutout.Requires <code>moderator:read:shoutouts</code> or <code>moderator:manage:shoutouts</code> scopes.',
        'mod',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutcreate',
    ),
);
topicsInfo.set(
    'ChannelShoutoutReceive',
    makeTopic(
        'channel.shoutout.receive',
        'Sends a notification when the specified broadcaster receives a Shoutout. Requires <code>moderator:read:shoutouts</code> or <code>moderator:manage:shoutouts</code> scopes.',
        'mod',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshoutoutreceive',
    ),
);
// info.set('ChannelUnbanRequestCreate', make('channel.unban_request.create', 'A user creates an unban request. Requires <code>moderator:read:unban_requests</code> or <code>moderator:manage:unban_requests</code> scopes.', 'mod', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestcreate'));
// info.set('ChannelUnbanRequestResolve', make('channel.unban_request.resolve', 'An unban request has been resolved. Requires <code>moderator:read:unban_requests</code> or <code>moderator:manage:unban_requests</code> scopes.', 'mod', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelunban_requestresolve'));
// info.set('ChannelModerate', make('channel.moderate', 'A moderator performs a moderation action in the specified channel. Check the documentation for requirements.', 'mod', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelmoderate'));

// Have cost
topicsInfo.set(
    'ChannelUpdate',
    makeTopic(
        'channel.update',
        'The broadcaster updates their channel properties e.g., category, title, content classification labels, broadcast, or language.',
        'any',
        1,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelupdate',
    ),
);
topicsInfo.set(
    'ChannelRaidTo',
    makeTopic(
        'channel.raid',
        'The specified channel is raided by another broadcaster’s channel.',
        'any',
        1,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelraid',
    ),
);
topicsInfo.set(
    'ChannelRaidFrom',
    makeTopic(
        'channel.raid',
        'The broadcaster raids another broadcaster’s channel.',
        'any',
        1,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelraid',
    ),
);
// info.set('ChannelSharedChatBegin', make('channel.shared_chat.begin', 'A notification when a channel becomes active in an active shared chat session.', 'any', 1, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatbegin'));
// info.set('ChannelSharedChatUpdate', make('channel.shared_chat.update', 'A notification when the active shared chat session the channel is in changes.', 'any', 1, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatupdate'));
// info.set('ChannelSharedChatEnd', make('channel.shared_chat.end', 'A notification when a channel leaves a shared chat session or the session ends.', 'any', 1, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelshared_chatend'));
topicsInfo.set(
    'StreamOnline',
    makeTopic(
        'stream.online',
        'The specified broadcaster starts a stream.',
        'any',
        1,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamonline',
    ),
);
topicsInfo.set(
    'StreamOffline',
    makeTopic(
        'stream.offline',
        'The specified broadcaster stops a stream.',
        'any',
        1,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamoffline',
    ),
);
topicsInfo.set(
    'UserUpdate',
    makeTopic(
        'user.update',
        'The user has updated their account.',
        'any',
        1,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#userupdate',
    ),
);

// Available to everyone
// info.set('ChannelChatClear', make('channel.chat.clear', 'A moderator or bot has cleared all messages from the chat room. Requires <code>user:read:chat</code> scope.', 'any', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear'));
// info.set('ChannelChatClearUserMessages', make('channel.chat.clear_user_messages', 'A moderator or bot has cleared all messages from a specific user. Requires <code>user:read:chat</code> scope.', 'any', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatclear_user_messages'));
topicsInfo.set(
    'ChannelChatMessage',
    makeTopic(
        'channel.chat.message',
        'Any user sends a message to a specific chat room. Requires <code>user:read:chat</code> scope.',
        'any',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage',
    ),
);
// info.set('ChannelChatMessageDelete', make('channel.chat.message_delete', 'A moderator has removed a specific message. Requires <code>user:read:chat</code> scope.', 'any', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage_delete'));
// info.set('ChannelChatNotification', make('channel.chat.notification', 'A notification for when an event that appears in chat has occurred. Requires <code>user:read:chat</code> scope.', 'any', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatnotification'));
// info.set('ChannelChatSettingsUpdate', make('channel.chat_settings.update', 'A notification for when the broadcaster’s chat settings are updated. Requires <code>user:read:chat</code> scope.', 'any', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchat_settingsupdate'));
// info.set('ChannelChatUserMessageHold', make('channel.chat.user_message_hold', 'A user is notified if their message is caught by automod. Requires <code>user:read:chat</code> scope.', 'any', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_hold'));
// info.set('ChannelChatUserMessageUpdate', make('channel.chat.user_message_update', 'A user is notified if their message’s automod status is updated. Requires <code>user:read:chat</code> scope.', 'any', 0, 'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatuser_message_update'));
topicsInfo.set(
    'ChannelVipAdd',
    makeTopic(
        'channel.vip.add',
        'A VIP is added to the channel. Requires <code>channel:read:vips</code> or <code>channel:manage:vips</code> scopes.',
        'any',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipadd',
    ),
);
topicsInfo.set(
    'ChannelVipRemove',
    makeTopic(
        'channel.vip.remove',
        'A VIP is removed from the channel. Requires <code>channel:read:vips</code> or <code>channel:manage:vips</code> scopes.',
        'any',
        0,
        'https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelvipremove',
    ),
);
