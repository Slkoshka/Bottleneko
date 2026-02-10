import type { ChatterDto, ChatterSummaryDto, DiscordChatterDto, Protocol, TelegramChatterDto, TwitchChatterDto } from './internal/api/bottleneko.gen.ts';
import runtime, { type NekoRuntime } from './runtime.ts';

export class ChatterSummary {
    id: string;
    displayName: string;
    username: string;
    isBot: boolean;

    constructor(chatter: ChatterSummaryDto) {
        this.id = chatter.id;
        this.displayName = chatter.displayName;
        this.username = chatter.username;
        this.isBot = chatter.isBot;
    }
}

export abstract class Chatter extends ChatterSummary {
    protocol: Protocol;

    constructor(protocol: Protocol, chatter: ChatterDto) {
        super(chatter);

        this.protocol = protocol;
    }

    static fromDto(chatter: ChatterDto) {
        switch (chatter.$type) {
            case "Discord": return new DiscordChatter(chatter);
            case "Telegram": return new TelegramChatter(chatter);
            case "Twitch": return new TwitchChatter(chatter);
        }
    }
}

export class DiscordChatter extends Chatter {
    discordId: string;
    discriminator: string | null;

    constructor(chatter: DiscordChatterDto) {
        super('Discord', chatter);

        this.discordId = chatter.discordId;
        this.discriminator = chatter.discriminator;
    }
}

export class TelegramChatter extends Chatter {
    telegramId: string;
    firstName: string;
    lastName: string | null;
    languageCode: string | null;
    hasPremium: boolean;
    addedToAttachmentMenu: boolean;

    constructor(chatter: TelegramChatterDto) {
        super('Telegram', chatter);

        this.telegramId = chatter.telegramId;
        this.firstName = chatter.firstName;
        this.lastName = chatter.lastName;
        this.languageCode = chatter.languageCode;
        this.hasPremium = chatter.hasPremium;
        this.addedToAttachmentMenu = chatter.addedToAttachmentMenu;
    }
}

export class TwitchChatter extends Chatter {
    twitchId: string;

    constructor(chatter: TwitchChatterDto) {
        super('Twitch', chatter);

        this.twitchId = chatter.twitchId;
    }
}

class Chatters {
    #runtime: NekoRuntime;

    constructor(runtime: NekoRuntime) {
        this.#runtime = runtime;
    }

    async get(id: ChatterDto['id']) {
        return Chatter.fromDto(await this.#runtime.rpc.chatters.get({ id }));
    }

    async list() {
        return (await this.#runtime.rpc.chatters.list({ })).map(chatter => Chatter.fromDto(chatter));
    }
}

export default new Chatters(runtime);
