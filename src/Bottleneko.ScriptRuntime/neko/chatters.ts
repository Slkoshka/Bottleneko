import type { Protocol } from './connections.ts';
import { internal__ChattersImpl } from './internal/export.ts';

export interface ChatterSummary {
    id: string;
    displayName: string;
    username: string;
    isBot: boolean;
}

export interface Chatter extends ChatterSummary {
    protocol: Protocol;
}

export interface DiscordChatter extends Chatter {
    protocol: 'Discord';
    discordId: string;
    discriminator: string | null;
}

export interface TelegramChatter extends Chatter {
    protocol: 'Telegram';
    telegramId: string;
    firstName: string;
    lastName: string | null;
    languageCode: string | null;
    hasPremium: boolean;
    addedToAttachmentMenu: boolean;
}

export interface TwitchChatter extends Chatter {
    protocol: 'Twitch';
    twitchId: string;
}

export interface Chatters {
    get: (id: string) => Promise<Chatter>;
    list: () => Promise<Chatter[]>;
}

export default internal__ChattersImpl as Chatters;
