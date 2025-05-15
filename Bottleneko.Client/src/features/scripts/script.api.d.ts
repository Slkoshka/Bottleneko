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

type Subscribe<T> = (callback: ((msg: T) => Promise | void), filter?: object | null | ((msg: T) => void) ) => Subscription;

interface When {
    connection: {
        messageReceived: Subscribe<ChatMessage>,
    },
}

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
    wait: (milliseconds: number) => Promise<void>;
    log: Log;
    when: When;
}

declare const neko: Bottleneko;
declare const log: Log;
declare const when: When;
declare const setInterval: (callback: Function, interval: number, ...arguments: any[]) => number;
declare const setTimeout: (callback: Function, delay: number, ...arguments: any[]) => number;
declare const clearInterval: (id: number) => void;
declare const clearTimeout: (id: number) => void;
