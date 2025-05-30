// Generated by Bottleneko.CodeGenerator

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface EnumValue<T> { ToString: () => string }

declare interface ConnectionStatus {
    NotConnected: EnumValue<ConnectionStatus>;
    Connecting: EnumValue<ConnectionStatus>;
    Connected: EnumValue<ConnectionStatus>;
    Reconnecting: EnumValue<ConnectionStatus>;
    Stopping: EnumValue<ConnectionStatus>;
    Error: EnumValue<ConnectionStatus>;
}

declare interface Protocol {
    Discord: EnumValue<Protocol>;
    Telegram: EnumValue<Protocol>;
    Twitch: EnumValue<Protocol>;
}

declare interface LogSeverity {
    Critical: EnumValue<LogSeverity>;
    Error: EnumValue<LogSeverity>;
    Warning: EnumValue<LogSeverity>;
    Info: EnumValue<LogSeverity>;
    Verbose: EnumValue<LogSeverity>;
    Debug: EnumValue<LogSeverity>;
}

declare interface ChatFlags {
    isPrivate: boolean;

    ToString: () => string | null;
}

declare interface Chat {
    id: bigint;
    protocol: EnumValue<Protocol>;
    connectionId: bigint;
    displayName: string;
    flags: ChatFlags;
    raw: DiscordChat | TelegramChat | TwitchChat;

    sendMessage: (text: string) => void;
    ToString: () => string | null;
}

declare interface ChatMessageAttachment {
    id: bigint;
    messageId: bigint;
    contentType: string;
    fileName: string | null;
    raw: DiscordChatMessageAttachment | TelegramChatMessageAttachment;

    ToString: () => string | null;
}

declare interface ChatMessageFlags {
    isSpecial: boolean;
    isDirect: boolean;
    isOffline: boolean;

    ToString: () => string | null;
}

declare interface ChatMessage {
    id: bigint;
    protocol: EnumValue<Protocol>;
    connectionId: bigint;
    timestamp: string;
    attachments: ChatMessageAttachment[];
    chat: Chat;
    author: Chatter;
    text: string | null;
    replyToId: bigint | null;
    flags: ChatMessageFlags;
    raw: DiscordChatMessage | TelegramChatMessage | TwitchChatMessage;

    reply: (text: string) => void;
    ToString: () => string | null;
}

declare interface ChatterFlags {
    isBot: boolean;

    ToString: () => string | null;
}

declare interface Chatter {
    id: bigint;
    protocol: EnumValue<Protocol>;
    connectionId: bigint;
    displayName: string;
    username: string;
    flags: ChatterFlags;
    raw: DiscordChatter | TelegramChatter | TwitchChatter;

    ToString: () => string | null;
}

declare interface Connection {
    id: bigint;
    protocol: EnumValue<Protocol>;
    name: string;
    status: EnumValue<ConnectionStatus>;
    raw: DiscordConnection | TelegramConnection | TwitchConnection;

    ToString: () => string | null;
}

declare interface TwitchChat {
    id: string;
    name: string;
    displayName: string;
    isWhisper: boolean;

    asDiscord: () => DiscordChat | null;
    asTelegram: () => TelegramChat | null;
    asTwitch: () => TwitchChat | null;
    ToString: () => string | null;
}

declare interface TwitchChatBadge {
    id: string;
    info: string;
    setId: string;

    ToString: () => string | null;
}

declare interface TwitchChatMessage {
    id: string;
    text: string;
    badges: TwitchChatBadge[];
    color: string;
    cheerBits: number | null;
    channelPointsCustomRewardId: string;
    isSubscriber: boolean | null;
    isModerator: boolean | null;
    isBroadcaster: boolean | null;
    isVip: boolean | null;
    isStaff: boolean | null;

    asDiscord: () => DiscordChatMessage | null;
    asTelegram: () => TelegramChatMessage | null;
    asTwitch: () => TwitchChatMessage | null;
    ToString: () => string | null;
}

declare interface TwitchChatter {
    id: string;
    login: string;
    displayName: string;

    asDiscord: () => DiscordChatter | null;
    asTelegram: () => TelegramChatter | null;
    asTwitch: () => TwitchChatter | null;
    ToString: () => string | null;
}

declare interface TwitchConnection {
    asDiscord: () => DiscordConnection | null;
    asTwelegram: () => TelegramConnection | null;
    asTwitch: () => TwitchConnection | null;
    ToString: () => string | null;
}

declare interface TelegramChatType {
    Private: EnumValue<TelegramChatType>;
    Group: EnumValue<TelegramChatType>;
    Channel: EnumValue<TelegramChatType>;
    Supergroup: EnumValue<TelegramChatType>;
    Sender: EnumValue<TelegramChatType>;
}

declare interface TelegramChat {
    id: bigint;
    type: EnumValue<TelegramChatType>;
    title: string;
    firstName: string;
    lastName: string;
    isForum: boolean;

    asDiscord: () => DiscordChat | null;
    asTelegram: () => TelegramChat | null;
    asTwitch: () => TwitchChat | null;
    ToString: () => string | null;
}

declare interface UnknownTelegramAttachmentExtra {
    ToString: () => string | null;
}

declare interface AnimationTelegramAttachmentExtra {
    width: number;
    height: number;
    duration: number;

    ToString: () => string | null;
}

declare interface AudioTelegramAttachmentExtra {
    duration: number;
    performer: string;
    title: string;

    ToString: () => string | null;
}

declare interface DocumentTelegramAttachmentExtra {
    ToString: () => string | null;
}

declare interface PhotoTelegramAttachmentExtra {
    width: number;
    height: number;

    ToString: () => string | null;
}

declare interface StickerTelegramAttachmentExtra {
    width: number;
    height: number;
    isAnimated: boolean;
    isVideo: boolean;
    emoji: string;
    setName: string;

    ToString: () => string | null;
}

declare interface VideoTelegramAttachmentExtra {
    width: number;
    height: number;
    duration: number;
    startTimestamp: number | null;

    ToString: () => string | null;
}

declare interface VideoNoteTelegramAttachmentExtra {
    width: number;
    height: number;
    duration: number;

    ToString: () => string | null;
}

declare interface VoiceTelegramAttachmentExtra {
    duration: number;

    ToString: () => string | null;
}

declare interface TelegramChatMessageAttachment {
    fileId: string;
    fileUniqueId: string;
    fileSize: bigint | null;
    extra: AnimationTelegramAttachmentExtra | AudioTelegramAttachmentExtra | DocumentTelegramAttachmentExtra | PhotoTelegramAttachmentExtra | StickerTelegramAttachmentExtra | VideoTelegramAttachmentExtra | VideoNoteTelegramAttachmentExtra | VoiceTelegramAttachmentExtra | UnknownTelegramAttachmentExtra;

    asDiscord: () => DiscordChatMessageAttachment | null;
    asTelegram: () => TelegramChatMessageAttachment | null;
    asTwitch: () => never | null;
    ToString: () => string | null;
}

declare interface TelegramChatMessage {
    asDiscord: () => DiscordChatMessage | null;
    asTelegram: () => TelegramChatMessage | null;
    asTwitch: () => TwitchChatMessage | null;
    ToString: () => string | null;
}

declare interface TelegramChatter {
    id: bigint;
    firstName: string;
    lastName: string;
    username: string;
    languageCode: string;
    isPremium: boolean;
    addedToAttachmentMenu: boolean;

    asDiscord: () => DiscordChatter | null;
    asTelegram: () => TelegramChatter | null;
    asTwitch: () => TwitchChatter | null;
    ToString: () => string | null;
}

declare interface TelegramConnection {
    asDiscord: () => DiscordConnection | null;
    asTwelegram: () => TelegramConnection | null;
    asTwitch: () => TwitchConnection | null;
    ToString: () => string | null;
}

declare interface DiscordGuild {
    id: bigint;
    name: string;
    description: string;
    ownerId: bigint;

    ToString: () => string | null;
}

declare interface DiscordChannelType {
    Text: EnumValue<DiscordChannelType>;
    DM: EnumValue<DiscordChannelType>;
    Voice: EnumValue<DiscordChannelType>;
    Group: EnumValue<DiscordChannelType>;
    Category: EnumValue<DiscordChannelType>;
    News: EnumValue<DiscordChannelType>;
    Store: EnumValue<DiscordChannelType>;
    NewsThread: EnumValue<DiscordChannelType>;
    PublicThread: EnumValue<DiscordChannelType>;
    PrivateThread: EnumValue<DiscordChannelType>;
    Stage: EnumValue<DiscordChannelType>;
    GuildDirectory: EnumValue<DiscordChannelType>;
    Forum: EnumValue<DiscordChannelType>;
    Media: EnumValue<DiscordChannelType>;
}

declare interface DiscordChannel {
    id: bigint;
    name: string;
    type: EnumValue<DiscordChannelType>;

    ToString: () => string | null;
}

declare interface DiscordChat {
    guild: DiscordGuild;
    channel: DiscordChannel;

    asDiscord: () => DiscordChat | null;
    asTelegram: () => TelegramChat | null;
    asTwitch: () => TwitchChat | null;
    ToString: () => string | null;
}

declare interface DiscordChatMessageAttachment {
    id: bigint;
    title: string;
    description: string;
    url: string;
    proxyUrl: string;

    asDiscord: () => DiscordChatMessageAttachment | null;
    asTelegram: () => TelegramChatMessageAttachment | null;
    asTwitch: () => never | null;
    ToString: () => string | null;
}

declare interface DiscordChatMessage {
    id: bigint;
    isPinned: boolean;
    isEveryoneMentioned: boolean;
    channelMentions: bigint[];
    roleMentions: bigint[];
    userMentions: bigint[];

    asDiscord: () => DiscordChatMessage | null;
    asTelegram: () => TelegramChatMessage | null;
    asTwitch: () => TwitchChatMessage | null;
    ToString: () => string | null;
}

declare interface DiscordChatter {
    id: bigint;
    username: string;
    discriminator: string;
    globalName: string;
    localName: string;

    asDiscord: () => DiscordChatter | null;
    asTelegram: () => TelegramChatter | null;
    asTwitch: () => TwitchChatter | null;
    ToString: () => string | null;
}

declare interface DiscordConnection {
    getChat: (id: bigint) => Promise<Chat>;
    asDiscord: () => DiscordConnection | null;
    asTwelegram: () => TelegramConnection | null;
    asTwitch: () => TwitchConnection | null;
    ToString: () => string | null;
}
