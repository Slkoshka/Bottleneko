/* eslint-disable */

type Logger = (...args: any[]) => void;

interface Log {
    critical: Logger;
    error: Logger;
    warning: Logger;
    info: Logger;
    verbose: Logger;
    debug: Logger;
}

type SubscriptionCallback<T> = (eventName: string, event: T) => void;

interface Subscription {
    cancel: () => void;
}

type Subscribe =
    ((event: 'connection/message_received', callback: SubscriptionCallback<ChatMessage & { flags: { offline: false } }>) => Subscription) &
    ((event: 'connection/offline_message', callback: SubscriptionCallback<ChatMessage & { flags: { offline: true } }>) => Subscription) &
    ((event: string, callback: SubscriptionCallback<any>) => Subscription);

interface Bottleneko {
    script: {
        name: string;
        stop: () => never;
    };
    connections: {
        get: (id: bigint) => Promise<Connection>;
    },
    types: {
        Protocol: Protocol;
        ConnectionStatus: ConnectionStatus;
        DiscordChannelType: DiscordChannelType;
    };
    on: Subscribe;
    wait: (milliseconds: number) => Promise<void>;
    log: Log;
}

declare const neko: Bottleneko;
declare const log: Log;
declare const setInterval: (callback: Function, interval: number, ...arguments: any[]) => number;
declare const setTimeout: (callback: Function, delay: number, ...arguments: any[]) => number;
declare const clearInterval: (id: number) => void;
declare const clearTimeout: (id: number) => void;
