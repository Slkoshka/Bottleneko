import type { AttachmentDto, DiscordAttachmentDto, Protocol, TelegramAttachmentDto, TwitchAttachmentDto } from './api/bottleneko.gen.ts';

export abstract class internal__AttachmentImpl<T extends Protocol = Protocol> {
    protocol: Protocol;
    id: string;
    name: string | null;
    contentType: string;

    constructor(protocol: T, attachment: AttachmentDto) {
        this.protocol = protocol;
        this.id = attachment.id;
        this.name = attachment.name;
        this.contentType = attachment.contentType;
    }

    static fromDto(attachment: AttachmentDto) {
        switch (attachment.$type) {
            case 'Discord': return new internal__DiscordAttachmentImpl(attachment);
            case 'Telegram': return new internal__TelegramAttachmentImpl(attachment);
            case 'Twitch': return new internal__TwitchAttachmentImpl(attachment);
        }
    }
}

export class internal__DiscordAttachmentImpl extends internal__AttachmentImpl<'Discord'> {
    discordId: string;
    description: string | null;
    title: string | null;
    url: string;
    proxyUrl: string;

    constructor(attachment: DiscordAttachmentDto) {
        super('Discord', attachment);

        this.discordId = attachment.discordId;
        this.description = attachment.description;
        this.title = attachment.title;
        this.url = attachment.url;
        this.proxyUrl = attachment.proxyUrl;
    }
}

export class internal__TelegramAttachmentImpl extends internal__AttachmentImpl<'Telegram'> {
    constructor(attachment: TelegramAttachmentDto) {
        super('Telegram', attachment);
    }
}

export class internal__TwitchAttachmentImpl extends internal__AttachmentImpl<'Twitch'> {
    constructor(attachment: TwitchAttachmentDto) {
        super('Twitch', attachment);
    }
}
