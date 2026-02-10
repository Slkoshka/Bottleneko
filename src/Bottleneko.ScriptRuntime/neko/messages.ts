import connections from "./connections.ts";
import type { AttachmentDto, ChannelTwitchChatMessageDto, ChatMessageDto, ChatMessageFilter, ChatMessageLetter, ChatSummaryDto, ChatterSummaryDto, DiscordChatMessageDto, TelegramChatMessageDto, TwitchChatBadge, WhisperTwitchChatMessageDto } from "./internal/api/bottleneko.gen.ts";
import type NekoRpc from "./internal/rpc/index.ts";
import runtime, { type NekoRuntime } from './runtime.ts';

const makeListener = (rpc: NekoRpc, callback: (message: ChatMessage) => Promise<void> | void, filter: ChatMessageFilter) => {
    return rpc.watch(
        [{ filter: filter ?? { connectionId: null, protocol: null } }],
        rpc.messages.subscribe,
        rpc.messages.unsubscribe,
        (letter) => callback(ChatMessage.fromDto(rpc, (letter as ChatMessageLetter).content))
    );
};

export abstract class ChatMessage {
    #rpc: NekoRpc;

    id: string;
    connectionId: string;
    timestamp: string;
    chat: ChatSummaryDto;
    author: ChatterSummaryDto;
    text: string | null;
    attachments: AttachmentDto[];
    isSpecial: boolean;
    isDirect: boolean;
    isMissed: boolean;

    constructor(rpc: NekoRpc, message: ChatMessageDto) {
        this.#rpc = rpc;

        this.id = message.id;
        this.connectionId = message.connectionId;
        this.timestamp = message.timestamp;
        this.chat = message.chat;
        this.author = message.author;
        this.text = message.textContent;
        this.attachments = message.attachments;
        this.isSpecial = message.isSpecial;
        this.isDirect = message.isDirect;
        this.isMissed = message.isMissed;
    }

    async replyText(text: string) {
        await this.#rpc.messages.sendText({
            connectionId: this.connectionId,
            chatId: this.chat.id,
            text,
            replyToMessageId: this.id,
        });
    }

    async getConnection() {
        return await connections.get(this.connectionId);
    }

    static fromDto(rpc: NekoRpc, message: ChatMessageDto) {
        switch (message.$type) {
            case "Discord": return new DiscordChatMessage(rpc, message);
            case "Telegram": return new TelegramChatMessage(rpc, message);
            case "Twitch.Channel": return new ChannelTwitchChatMessage(rpc, message);
            case "Twitch.Whisper": return new WhisperTwitchChatMessage(rpc, message);
        }
    }
}

export class DiscordChatMessage extends ChatMessage {
    discordId: string;
    isPinned: boolean;
    mentions: {
        everyone: boolean;
        channelIds: string[];
        roleIds: string[];
        userIds: string[];
    };

    constructor(rpc: NekoRpc, message: DiscordChatMessageDto) {
        super(rpc, message);

        this.discordId = message.discordId;
        this.isPinned = message.isPinned;
        this.mentions = {
            everyone: message.isEveryoneMentioned,
            channelIds: message.channelMentions,
            roleIds: message.roleMentions,
            userIds: message.userMentions,
        };
    }
}

export class TelegramChatMessage extends ChatMessage {
    constructor(rpc: NekoRpc, message: TelegramChatMessageDto) {
        super(rpc, message);
    }
}

export abstract class TwitchChatMessage extends ChatMessage {
    twitchId: string;

    constructor(rpc: NekoRpc, message: ChannelTwitchChatMessageDto | WhisperTwitchChatMessageDto) {
        super(rpc, message);

        this.twitchId = message.twitchId;
    }
}

export class ChannelTwitchChatMessage extends TwitchChatMessage {
    badges: TwitchChatBadge[];
    color: string;
    cheerBits: number | null;
    channelPointsCustomRewardId: string | null;
    roles: {
        isSubscriber: boolean;
        isModerator: boolean;
        isBroadcaster: boolean;
        isVip: boolean;
        isStaff: boolean;
    }

    constructor(rpc: NekoRpc, message: ChannelTwitchChatMessageDto) {
        super(rpc, message);

        this.badges = message.badges;
        this.color = message.color;
        this.cheerBits = message.cheerBits;
        this.channelPointsCustomRewardId = message.channelPointsCustomRewardId;
        this.roles = {
            isSubscriber: message.isSubscriber,
            isModerator: message.isModerator,
            isBroadcaster: message.isBroadcaster,
            isVip: message.isVip,
            isStaff: message.isStaff,
        };
    }
}

export class WhisperTwitchChatMessage extends TwitchChatMessage {
    constructor(rpc: NekoRpc, message: WhisperTwitchChatMessageDto) {
        super(rpc, message);
    }
}

class Messages {
    #runtime: NekoRuntime;

    constructor(runtime: NekoRuntime) {
        this.#runtime = runtime;
    }

    get received() {
        return {
            listen: (callback: Parameters<typeof makeListener>[1]) => makeListener(this.#runtime.rpc, callback, { connectionId: null, protocol: null }),

            filteredBy: (filter: ChatMessageFilter) => {
                return {
                    listen: (callback: Parameters<typeof makeListener>[1]) => makeListener(this.#runtime.rpc, callback, filter),
                };
            },
        }
    }
}

export default new Messages(runtime);
