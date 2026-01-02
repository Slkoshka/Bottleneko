import { Ref } from 'react';
import { Protocol, ProtocolConfiguration } from '../api/dtos.gen';
import DiscordConfigEditor from './discord/DiscordConfigEditor';
import TelegramConfigEditor from './telegram/TelegramConfigEditor';
import TwitchConfigEditor from './twitch/TwitchConfigEditor';

export interface ConnectionDefinition {
    name: string;
    config: ProtocolConfiguration;
}

export interface ProtocolInfo {
    name: string;
    icon: string | null;
    configEditor: React.ComponentType<{ definition: ConnectionDefinition | null; disabled?: boolean; onValidated: (definition: ConnectionDefinition) => void; ref?: Ref<HTMLFormElement> }>;
}

export const protocols: Record<Protocol, ProtocolInfo> = {
    [Protocol.Discord]: { name: 'Discord', icon: 'discord', configEditor: DiscordConfigEditor },
    [Protocol.Twitch]: { name: 'Twitch', icon: 'twitch', configEditor: TwitchConfigEditor },
    [Protocol.Telegram]: { name: 'Telegram', icon: 'telegram', configEditor: TelegramConfigEditor },
};
