import type { ChatterDto, ChatterSummaryDto, DiscordChatterDto, Protocol, TelegramChatterDto, TwitchChatterDto } from './api/bottleneko.gen.ts';
import runtime from './runtime.ts';
import type { Chatter, ChatterSummary, DiscordChatter, TelegramChatter, TwitchChatter } from '../chatters.ts';

export class internal__ChatterSummaryImpl implements ChatterSummary {
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

export abstract class internal__ChatterImpl<T extends Protocol = Protocol> extends internal__ChatterSummaryImpl implements Chatter {
    protocol: T;

    constructor(protocol: T, chatter: ChatterDto) {
        super(chatter);

        this.protocol = protocol;
    }

    static fromDto(chatter: ChatterDto) {
        switch (chatter.$type) {
            case 'Discord': return new internal__DiscordChatterImpl(chatter);
            case 'Telegram': return new internal__TelegramChatterImpl(chatter);
            case 'Twitch': return new internal__TwitchChatterImpl(chatter);
        }
    }
}

export class internal__DiscordChatterImpl extends internal__ChatterImpl<'Discord'> implements DiscordChatter {
    discordId: string;
    discriminator: string | null;

    constructor(chatter: DiscordChatterDto) {
        super('Discord', chatter);

        this.discordId = chatter.discordId;
        this.discriminator = chatter.discriminator;
    }
}

export class internal__TelegramChatterImpl extends internal__ChatterImpl<'Telegram'> implements TelegramChatter {
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

export class internal__TwitchChatterImpl extends internal__ChatterImpl<'Twitch'> implements TwitchChatter {
    twitchId: string;

    constructor(chatter: TwitchChatterDto) {
        super('Twitch', chatter);

        this.twitchId = chatter.twitchId;
    }
}

export default {
    async get(id: ChatterDto['id']) {
        return internal__ChatterImpl.fromDto(await runtime.get().rpc.chatters.get({ id }));
    },

    async list() {
        return (await runtime.get().rpc.chatters.list({ })).map(chatter => internal__ChatterImpl.fromDto(chatter));
    },
};
