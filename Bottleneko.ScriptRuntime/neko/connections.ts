import type { ConnectionDto, DiscordConnectionDto, ExtendedConnectionStatus, TelegramConnectionDto } from './internal/api/bottleneko.gen.ts';
import type NekoRpc from './internal/rpc/index.ts';
import runtime, { type NekoRuntime } from './runtime.ts';

export abstract class Connection {
    #rpc: NekoRpc;
    id: string;
    name: string;
    autoStart: boolean;
    status: ExtendedConnectionStatus;

    constructor(rpc: NekoRpc, connection: ConnectionDto) {
        this.#rpc = rpc;
        this.id = connection.id;
        this.name = connection.name;
        this.autoStart = connection.autoStart;
        this.status = connection.extendedStatus;
    }

    async sendText(chatId: string, text: string) {
        await this.#rpc.messages.sendText({
            connectionId: this.id,
            chatId,
            text,
            replyToMessageId: null,
        });
    }

    static fromDto(rpc: NekoRpc, connection: ConnectionDto) {
            switch (connection.$type) {
                case "Discord": return new DiscordConnection(rpc, connection);
                case "Telegram": return new TelegramConnection(rpc, connection);
                case "Twitch": return new TwitchConnection(rpc, connection);
            }
        }
}

export class DiscordConnection extends Connection {
    constructor(rpc: NekoRpc, connection: DiscordConnectionDto) {
        super(rpc, connection);
    }
}

export class TelegramConnection extends Connection {
    constructor(rpc: NekoRpc, connection: TelegramConnectionDto) {
        super(rpc, connection);
    }
}

export class TwitchConnection extends Connection {
    constructor(rpc: NekoRpc, connection: ConnectionDto) {
        super(rpc, connection);
    }
}

class Connections {
    #runtime: NekoRuntime;

    constructor(runtime: NekoRuntime) {
        this.#runtime = runtime;
    }

    async get(id: ConnectionDto['id']) {
        return Connection.fromDto(this.#runtime.rpc, await this.#runtime.rpc.connections.get({ id }));
    }

    async list() {
        return (await this.#runtime.rpc.connections.list({ })).map(connection => Connection.fromDto(this.#runtime.rpc, connection));
    }
}

export default new Connections(runtime);
