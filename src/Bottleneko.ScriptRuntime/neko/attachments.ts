import type { Protocol } from './connections.ts';

export interface Attachment {
    protocol: Protocol;
    id: string;
    name: string | null;
    contentType: string;
}

export interface DiscordAttachment extends Attachment {
    protocol: 'Discord';
    discordId: string;
    description: string | null;
    title: string | null;
    url: string;
    proxyUrl: string;
}

export interface TelegramAttachment extends Attachment {
    protocol: 'Telegram';
}

export interface TwitchAttachment extends Attachment {
    protocol: 'Twitch';
}
