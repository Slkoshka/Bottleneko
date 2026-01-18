import { type Protocol, type ProtocolConfiguration } from '$lib/api/dtos.gen';
import type { Component } from 'svelte';
import DiscordConfigEditor from './protocols/DiscordConfigEditor.svelte';
import TelegramConfigEditor from './protocols/TelegramConfigEditor.svelte';
import TwitchConfigEditor from './protocols/TwitchConfigEditor.svelte';

export { state as Connections } from './provider.svelte';

export interface ConnectionDefinition<Type extends ProtocolConfiguration = ProtocolConfiguration> {
    name: string;
    config: Type;
}

export interface Props<Type extends ProtocolConfiguration = ProtocolConfiguration> {
    definition: ConnectionDefinition<Type> | null;
    disabled?: boolean;
    onsubmit?: (definition: ConnectionDefinition<Type>) => Promise<void>;
}

export interface ConfigEditorExports {
    submit: () => void;
}

export type ConnectionConfigEditor = ConfigEditorExports;

export interface ProtocolInfo {
    name: string;
    icon: string;
    description?: string;
    editor?: Component<Props, ConfigEditorExports>;
}

export const protocols: Record<Protocol, ProtocolInfo> = {
    ['Discord']: {
        name: 'Discord',
        icon: 'discord',
        description: 'Connect to Discord as an application using a bot token',
        editor: DiscordConfigEditor,
    },
    ['Twitch']: {
        name: 'Twitch',
        icon: 'twitch',
        description: 'Connect to Twitch using a user account',
        editor: TwitchConfigEditor,
    },
    ['Telegram']: {
        name: 'Telegram',
        icon: 'telegram',
        description: 'Connect to Telegram using a bot token',
        editor: TelegramConfigEditor,
    },
};
