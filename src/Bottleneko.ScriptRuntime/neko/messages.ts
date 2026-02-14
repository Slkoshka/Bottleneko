import { internal__MessagesImpl, type internal__ChatMessageFilter, type internal__TwitchChatBadge } from './internal/export.ts';
import type { Protocol } from './connections.ts';
import type { Attachment } from './attachments.ts';
import type { ChatterSummary } from './chatters.ts';
import type { ChatSummary } from "./chats.ts";

export type ChatMessageFilter = internal__ChatMessageFilter;
export type TwitchChatBadge = internal__TwitchChatBadge;

export interface ChatMessage {
    protocol: Protocol;
    id: string;
    connectionId: string;
    timestamp: string;
    chat: ChatSummary;
    author: ChatterSummary;
    text: string | null;
    attachments: Attachment[];
    isSpecial: boolean;
    isDirect: boolean;
    isMissed: boolean;
    
    replyText(text: string): Promise<void>;
}

export interface DiscordChatMessage extends ChatMessage {
    protocol: 'Discord';
    discordId: string;
    isPinned: boolean;
    mentions: {
        everyone: boolean;
        channelIds: string[];
        roleIds: string[];
        userIds: string[];
    };
}

export interface TelegramChatMessage extends ChatMessage {
    protocol: 'Telegram';
}

export interface TwitchChatMessage extends ChatMessage {
    protocol: 'Twitch';
    twitchId: string;
    isWhisper: boolean;
}

export interface ChannelTwitchChatMessage extends TwitchChatMessage {
    isWhisper: false;
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
}

export interface WhisperTwitchChatMessage extends TwitchChatMessage {
    isWhisper: true;
}

export interface ChatMessageReceivedEvent {
    listen: (callback: (message: ChatMessage) => Promise<void>) => Promise<() => void>
}

export interface Messages {
    received: ChatMessageReceivedEvent & {
        filteredBy: (filter: ChatMessageFilter) => ChatMessageReceivedEvent;
    };

}

export default internal__MessagesImpl as Messages;
