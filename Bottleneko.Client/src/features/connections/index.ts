import { LegacyRef } from 'react';
import { ConnectionDto, Protocol, ProtocolConfiguration } from '../api/dtos.gen';
import DiscordConfigEditor from './discord/DiscordConfigEditor';
import TelegramConfigEditor from './telegram/TelegramConfigEditor';
import TwitchConfigEditor from './twitch/TwitchConfigEditor';
import { Telegram } from './telegram';
import { Twitch } from './twitch';
import { Discord } from './discord';

export interface Connection<Type extends Protocol, Config extends ProtocolConfiguration> { _: Type | Config }

export type ExtractDto<Type> = Type extends Connection<infer A, infer B> ? ConnectionDto & { protocol: A; config: B } : never;
export type ExtractConfig<Type> = Type extends Connection<Protocol, infer X> ? X : never;
export type ExtractProtocol<Type> = Type extends Connection<infer X, ProtocolConfiguration> ? X : never;

export type AnyConnection = Discord | Twitch | Telegram;

export type AnyConnectionConfig = ExtractConfig<AnyConnection>;
export type AnyConnectionDto = ExtractDto<AnyConnection>;

export interface ConnectionDefinition {
    name: string;
    config: AnyConnectionConfig;
}

export interface ProtocolInfo {
    name: string;
    icon: string | null;
    configEditor: React.ComponentType<{ definition: ConnectionDefinition | null; disabled?: boolean; onValidated: (definition: ConnectionDefinition) => void; ref?: LegacyRef<HTMLFormElement> }>;
}

export const protocols: Record<Protocol, ProtocolInfo> = {
    [Protocol.Discord]: { name: 'Discord', icon: 'discord', configEditor: DiscordConfigEditor },
    [Protocol.Twitch]: { name: 'Twitch', icon: 'twitch', configEditor: TwitchConfigEditor },
    [Protocol.Telegram]: { name: 'Telegram', icon: 'telegram', configEditor: TelegramConfigEditor },
};
