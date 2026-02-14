import type { ConnectionDto, DiscordConnectionDto, ExtendedConnectionStatus, Protocol, TelegramConnectionDto } from './api/bottleneko.gen.ts';
import runtime from './runtime.ts';
import type { Connection, DiscordConnection, TelegramConnection, TwitchConnection } from '../connections.ts';

export abstract class internal__ConnectionImpl<T extends Protocol = Protocol> implements Connection {
    protocol: T;
    id: string;
    name: string;
    autoStart: boolean;
    status: ExtendedConnectionStatus;

    constructor(protocol: T, connection: ConnectionDto) {
        this.protocol = protocol;
        this.id = connection.id;
        this.name = connection.name;
        this.autoStart = connection.autoStart;
        this.status = connection.extendedStatus;
    }

    async sendText(chatId: string, text: string) {
        await runtime.get().rpc.messages.sendText({
            connectionId: this.id,
            chatId,
            text,
            replyToMessageId: null,
        });
    }

    static fromDto(connection: ConnectionDto) {
        switch (connection.$type) {
            case 'Discord': return new internal__DiscordConnectionImpl(connection);
            case 'Telegram': return new internal__TelegramConnectionImpl( connection);
            case 'Twitch': return new internal__TwitchConnectionImpl(connection);
        }
    }
}

export class internal__DiscordConnectionImpl extends internal__ConnectionImpl<'Discord'> implements DiscordConnection {
    constructor(connection: DiscordConnectionDto) {
        super('Discord', connection);
    }
}

export class internal__TelegramConnectionImpl extends internal__ConnectionImpl<'Telegram'> implements TelegramConnection {
    constructor(connection: TelegramConnectionDto) {
        super('Telegram', connection);
    }
}

export class internal__TwitchConnectionImpl extends internal__ConnectionImpl<'Twitch'> implements TwitchConnection {
    constructor(connection: ConnectionDto) {
        super('Twitch', connection);
    }
}

export default {
    async get(id: ConnectionDto['id']) {
        return internal__ConnectionImpl.fromDto(await runtime.get().rpc.connections.get({ id }));
    },

    async list() {
        return (await runtime.get().rpc.connections.list({ })).map(connection => internal__ConnectionImpl.fromDto(connection));
    },
};
