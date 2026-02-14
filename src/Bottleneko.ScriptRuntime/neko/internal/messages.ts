import { internal__ChatterSummaryImpl } from './chatters.ts';
import connections from './connections.ts';
import type { ChannelTwitchChatMessageDto, ChatMessageDto, ChatMessageFilter, ChatMessageLetter, DiscordChatMessageDto, Protocol, TelegramChatMessageDto, TwitchChatBadge, WhisperTwitchChatMessageDto } from './api/bottleneko.gen.ts';
import type NekoRpc from './rpc/index.ts';
import runtime from './runtime.ts';
import { internal__AttachmentImpl } from './attachments.ts';
import type { ChannelTwitchChatMessage, ChatMessage, DiscordChatMessage, TelegramChatMessage, TwitchChatMessage, WhisperTwitchChatMessage } from '../messages.ts';
import { internal__ChatSummaryImpl } from './chats.ts';

const makeListener = (rpc: NekoRpc, callback: (message: ChatMessageImpl) => Promise<void> | void, filter: ChatMessageFilter) => {
    return rpc.watch(
        [{ filter: filter ?? { connectionId: null, protocol: null } }],
        rpc.messages.subscribe,
        rpc.messages.unsubscribe,
        (letter) => callback(ChatMessageImpl.fromDto(rpc, (letter as ChatMessageLetter).content))
    );
};

export abstract class ChatMessageImpl<T extends Protocol = Protocol> implements ChatMessage {
    #rpc: NekoRpc;

    protocol: T;
    id: string;
    connectionId: string;
    timestamp: string;
    chat: internal__ChatSummaryImpl;
    author: internal__ChatterSummaryImpl;
    text: string | null;
    attachments: internal__AttachmentImpl[];
    isSpecial: boolean;
    isDirect: boolean;
    isMissed: boolean;

    constructor(rpc: NekoRpc, protocol: T, message: ChatMessageDto) {
        this.#rpc = rpc;

        this.protocol = protocol;
        this.id = message.id;
        this.connectionId = message.connectionId;
        this.timestamp = message.timestamp;
        this.chat = new internal__ChatSummaryImpl(message.chat);
        this.author = new internal__ChatterSummaryImpl(message.author);
        this.text = message.textContent;
        this.attachments = message.attachments.map(internal__AttachmentImpl.fromDto);
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
            case 'Discord': return new DiscordChatMessageImpl(rpc, message);
            case 'Telegram': return new TelegramChatMessageImpl(rpc, message);
            case 'Twitch.Channel': return new ChannelTwitchChatMessageImpl(rpc, message);
            case 'Twitch.Whisper': return new WhisperTwitchChatMessageImpl(rpc, message);
        }
    }
}

export class DiscordChatMessageImpl extends ChatMessageImpl<'Discord'> implements DiscordChatMessage {
    discordId: string;
    isPinned: boolean;
    mentions: {
        everyone: boolean;
        channelIds: string[];
        roleIds: string[];
        userIds: string[];
    };

    constructor(rpc: NekoRpc, message: DiscordChatMessageDto) {
        super(rpc, 'Discord', message);

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

export class TelegramChatMessageImpl extends ChatMessageImpl<'Telegram'> implements TelegramChatMessage {
    constructor(rpc: NekoRpc, message: TelegramChatMessageDto) {
        super(rpc, 'Telegram', message);
    }
}

export abstract class TwitchChatMessageImpl<T extends boolean = boolean> extends ChatMessageImpl<'Twitch'> implements TwitchChatMessage {
    twitchId: string;
    isWhisper: T;

    constructor(rpc: NekoRpc, isWhisper: T, message: ChannelTwitchChatMessageDto | WhisperTwitchChatMessageDto) {
        super(rpc, 'Twitch', message);

        this.twitchId = message.twitchId;
        this.isWhisper = isWhisper;
    }
}

export class ChannelTwitchChatMessageImpl extends TwitchChatMessageImpl<false> implements ChannelTwitchChatMessage {
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
        super(rpc, false, message);

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

export class WhisperTwitchChatMessageImpl extends TwitchChatMessageImpl<true> implements WhisperTwitchChatMessage {
    constructor(rpc: NekoRpc, message: WhisperTwitchChatMessageDto) {
        super(rpc, true, message);
    }
}

export default {
    get received() {
        return {
            listen: (callback: (message: ChatMessageImpl) => Promise<void>) => makeListener(runtime.get().rpc, callback, { connectionId: null, protocol: null }),

            filteredBy: (filter: ChatMessageFilter) => {
                return {
                    listen: (callback: (message: ChatMessageImpl) => Promise<void>) => makeListener(runtime.get().rpc, callback, filter),
                };
            },
        }
    }
};
