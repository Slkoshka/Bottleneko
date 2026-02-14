import { internal__ConnectionsImpl, type internal__ExtendedConnectionStatus, type internal__Protocol } from './internal/export.ts';

export type Protocol = internal__Protocol;
export type ExtendedConnectionStatus = internal__ExtendedConnectionStatus;

export interface Connection {
    protocol: Protocol;
    id: string;
    name: string;
    autoStart: boolean;
    status: ExtendedConnectionStatus;

    sendText: (chatId: string, text: string) => Promise<void>;
}

export interface DiscordConnection extends Connection {
    protocol: 'Discord';
}

export interface TelegramConnection extends Connection {
    protocol: 'Telegram';
}

export interface TwitchConnection extends Connection {
    protocol: 'Twitch';
}

export interface Connections {
    get: (id: string) => Promise<Connection>;
    list: () => Promise<Connection[]>;
}

export default internal__ConnectionsImpl as Connections;
