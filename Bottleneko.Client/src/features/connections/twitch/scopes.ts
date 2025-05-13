import { TwitchScope } from '../../api/dtos.gen';

export const scopeNameToScope: Record<string, TwitchScope> = {
    'analytics:read:extensions': TwitchScope.AnalyticsReadExtensions,
    'analytics:read:games': TwitchScope.AnalyticsReadGames,
    'bits:read': TwitchScope.BitsRead,
    'channel:bot': TwitchScope.ChannelBot, // only needed for connections using app access tokens (we don't)
    'channel:edit:commercial': TwitchScope.ChannelEditCommercial,
    'channel:manage:ads': TwitchScope.ChannelManageAds,
    'channel:manage:broadcast': TwitchScope.ChannelManageBroadcast,
    'channel:manage:extensions': TwitchScope.ChannelManageExtensions,
    'channel:manage:guest_star': TwitchScope.ChannelManageGuestStar,
    'channel:manage:moderators': TwitchScope.ChannelManageModerators,
    'channel:manage:polls': TwitchScope.ChannelManagePolls,
    'channel:manage:predictions': TwitchScope.ChannelManagePredictions,
    'channel:manage:raids': TwitchScope.ChannelManageRaids,
    'channel:manage:redemptions': TwitchScope.ChannelManageRedemptions,
    'channel:manage:schedule': TwitchScope.ChannelManageSchedule,
    'channel:manage:videos': TwitchScope.ChannelManageVideos,
    'channel:manage:vips': TwitchScope.ChannelManageVips,
    'channel:moderate': TwitchScope.ChannelModerate,
    'channel:read:ads': TwitchScope.ChannelReadAds,
    'channel:read:charity': TwitchScope.ChannelReadCharity,
    'channel:read:editors': TwitchScope.ChannelReadEditors,
    'channel:read:goals': TwitchScope.ChannelReadGoals,
    'channel:read:guest_star': TwitchScope.ChannelReadGuestStar,
    'channel:read:hype_train': TwitchScope.ChannelReadHypeTrain,
    'channel:read:polls': TwitchScope.ChannelReadPolls,
    'channel:read:predictions': TwitchScope.ChannelReadPredictions,
    'channel:read:redemptions': TwitchScope.ChannelReadRedemptions,
    'channel:read:stream_key': TwitchScope.ChannelReadStreamKey,
    'channel:read:subscriptions': TwitchScope.ChannelReadSubscriptions,
    'channel:read:vips': TwitchScope.ChannelReadVips,
    'clips:edit': TwitchScope.ClipsEdit,
    'moderation:read': TwitchScope.ModerationRead,
    'moderator:manage:announcements': TwitchScope.ModeratorManageAnnouncements,
    'moderator:manage:automod': TwitchScope.ModeratorManageAutomod,
    'moderator:manage:automod_settings': TwitchScope.ModeratorManageAutomodSettings,
    'moderator:manage:banned_users': TwitchScope.ModeratorManageBannedUsers,
    'moderator:manage:blocked_terms': TwitchScope.ModeratorManageBlockedTerms,
    'moderator:manage:chat_messages': TwitchScope.ModeratorManageChatMessages,
    'moderator:manage:chat_settings': TwitchScope.ModeratorManageChatSettings,
    'moderator:manage:guest_star': TwitchScope.ModeratorManageGuestStar,
    'moderator:manage:shield_mode': TwitchScope.ModeratorManageShieldMode,
    'moderator:manage:shoutouts': TwitchScope.ModeratorManageShoutouts,
    'moderator:manage:unban_requests': TwitchScope.ModeratorManageUnbanRequests,
    'moderator:manage:warnings': TwitchScope.ModeratorManageWarnings,
    'moderator:read:automod_settings': TwitchScope.ModeratorReadAutomodSettings,
    'moderator:read:banned_users': TwitchScope.ModeratorReadBannedUsers,
    'moderator:read:blocked_terms': TwitchScope.ModeratorReadBlockedTerms,
    'moderator:read:chat_messages': TwitchScope.ModeratorReadChatMessages,
    'moderator:read:chat_settings': TwitchScope.ModeratorReadChatSettings,
    'moderator:read:chatters': TwitchScope.ModeratorReadChatters,
    'moderator:read:followers': TwitchScope.ModeratorReadFollowers,
    'moderator:read:guest_star': TwitchScope.ModeratorReadGuestStar,
    'moderator:read:moderators': TwitchScope.ModeratorReadModerators,
    'moderator:read:shield_mode': TwitchScope.ModeratorReadShieldMode,
    'moderator:read:shoutouts': TwitchScope.ModeratorReadShoutouts,
    'moderator:read:suspicious_users': TwitchScope.ModeratorReadSuspiciousUsers,
    'moderator:read:unban_requests': TwitchScope.ModeratorReadUnbanRequests,
    'moderator:read:vips': TwitchScope.ModeratorReadVips,
    'moderator:read:warnings': TwitchScope.ModeratorReadWarnings,
    'user:bot': TwitchScope.UserBot, // only needed if we use with app access tokens
    'user:edit': TwitchScope.UserEdit,
    'user:edit:broadcast': TwitchScope.UserEditBroadcast,
    'user:manage:blocked_users': TwitchScope.UserManageBlockedUsers,
    'user:manage:chat_color': TwitchScope.UserManageChatColor,
    'user:manage:whispers': TwitchScope.UserManageWhispers,
    'user:read:blocked_users': TwitchScope.UserReadBlockedUsers,
    'user:read:broadcast': TwitchScope.UserReadBroadcast,
    'user:read:chat': TwitchScope.UserReadChat,
    'user:read:email': TwitchScope.UserReadEmail,
    'user:read:emotes': TwitchScope.UserReadEmotes,
    'user:read:follows': TwitchScope.UserReadFollows,
    'user:read:moderated_channels': TwitchScope.UserReadModeratedChannels,
    'user:read:subscriptions': TwitchScope.UserReadSubscriptions,
    'user:read:whispers': TwitchScope.UserReadWhispers,
    'user:write:chat': TwitchScope.UserWriteChat,
};

export const scopeToScopeName = new Map<TwitchScope, string>();
for (const [key, value] of Object.entries(scopeNameToScope)) {
    scopeToScopeName.set(value, key);
}

export const moderateScopes = [
    TwitchScope.ChannelModerate,
    TwitchScope.ModerationRead,
    TwitchScope.ModeratorManageAnnouncements,
    TwitchScope.ModeratorManageAutomod,
    TwitchScope.ModeratorManageAutomodSettings,
    TwitchScope.ModeratorManageBannedUsers,
    TwitchScope.ModeratorManageBlockedTerms,
    TwitchScope.ModeratorManageChatMessages,
    TwitchScope.ModeratorManageChatSettings,
    TwitchScope.ModeratorManageGuestStar,
    TwitchScope.ModeratorManageShieldMode,
    TwitchScope.ModeratorManageShoutouts,
    TwitchScope.ModeratorManageUnbanRequests,
    TwitchScope.ModeratorManageWarnings,
    TwitchScope.ModeratorReadAutomodSettings,
    TwitchScope.ModeratorReadBannedUsers,
    TwitchScope.ModeratorReadBlockedTerms,
    TwitchScope.ModeratorReadChatMessages,
    TwitchScope.ModeratorReadChatSettings,
    TwitchScope.ModeratorReadChatters,
    TwitchScope.ModeratorReadFollowers,
    TwitchScope.ModeratorReadGuestStar,
    TwitchScope.ModeratorReadModerators,
    TwitchScope.ModeratorReadShieldMode,
    TwitchScope.ModeratorReadShoutouts,
    TwitchScope.ModeratorReadSuspiciousUsers,
    TwitchScope.ModeratorReadUnbanRequests,
    TwitchScope.ModeratorReadVips,
    TwitchScope.ModeratorReadWarnings,
];

export const viewChannelInfoScopes = [
    TwitchScope.BitsRead,
    TwitchScope.ChannelReadAds,
    TwitchScope.ChannelReadCharity,
    TwitchScope.ChannelReadEditors,
    TwitchScope.ChannelReadGoals,
    TwitchScope.ChannelReadGuestStar,
    TwitchScope.ChannelReadHypeTrain,
    TwitchScope.ChannelReadPolls,
    TwitchScope.ChannelReadPredictions,
    TwitchScope.ChannelReadRedemptions,
    TwitchScope.ChannelReadStreamKey,
    TwitchScope.ChannelReadSubscriptions,
    TwitchScope.ChannelReadVips,
];

export const editChannelInfoScopes = [
    TwitchScope.ChannelEditCommercial,
    TwitchScope.ChannelManageAds,
    TwitchScope.ChannelManageBroadcast,
    TwitchScope.ChannelManageExtensions,
    TwitchScope.ChannelManageGuestStar,
    TwitchScope.ChannelManageModerators,
    TwitchScope.ChannelManagePolls,
    TwitchScope.ChannelManagePredictions,
    TwitchScope.ChannelManageRaids,
    TwitchScope.ChannelManageRedemptions,
    TwitchScope.ChannelManageSchedule,
    TwitchScope.ChannelManageVideos,
    TwitchScope.ChannelManageVips,
];

export const createClipsScopes = [
    TwitchScope.ClipsEdit,
];

export const viewUserInfoScopes = [
    TwitchScope.UserReadBlockedUsers,
    TwitchScope.UserReadBroadcast,
    TwitchScope.UserReadEmail,
    TwitchScope.UserReadEmotes,
    TwitchScope.UserReadFollows,
    TwitchScope.UserReadModeratedChannels,
    TwitchScope.UserReadSubscriptions,
];

export const editUserInfoScopes = [
    TwitchScope.UserEdit,
    TwitchScope.UserEditBroadcast,
    TwitchScope.UserManageBlockedUsers,
    TwitchScope.UserManageChatColor,
];

export const chatScopes = [
    TwitchScope.UserReadChat,
    TwitchScope.UserWriteChat,
];

export const whispersScopes = [
    TwitchScope.UserReadWhispers,
    TwitchScope.UserManageWhispers,
];
