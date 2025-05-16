import connections from './connections';
import log from './log';
import script from './script';
import types from './types';
import when from './when';
export { connections, log, script, types, when, };
export * from './timers';
declare const _default: {
    types: {
        Protocol: Protocol;
        ConnectionStatus: ConnectionStatus;
        DiscordChannelType: DiscordChannelType;
    };
    when: {
        connection: {
            messageReceived: (callback: (msg: ChatMessage) => void, filter?: (object | ((msg: ChatMessage) => boolean)) | undefined) => void;
        };
    };
    wait: (milliseconds: number) => Promise<void>;
    setInterval: (callback: (...args: unknown[]) => void, interval: number, ...args: unknown[]) => unknown;
    setTimeout: (callback: (...args: unknown[]) => void, delay: number, ...args: unknown[]) => unknown;
    clearInterval: (id: unknown) => boolean;
    clearTimeout: (id: unknown) => boolean;
    connections: {
        get: (id: bigint) => Promise<Connection>;
    };
    log: {
        critical: (...args: unknown[]) => void;
        error: (...args: unknown[]) => void;
        warning: (...args: unknown[]) => void;
        info: (...args: unknown[]) => void;
        verbose: (...args: unknown[]) => void;
        debug: (...args: unknown[]) => void;
    };
    script: {
        name: string;
        stop: () => void;
    };
};
export default _default;
