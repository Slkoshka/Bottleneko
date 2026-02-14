import process from 'node:process';
import NekoRpc, { type TransportType } from './rpc/index.ts';
import type { NekoRuntime } from '../runtime.ts';
import log from './log.ts';
import { format, inspect, type InspectOptions } from 'node:util';

class CustomConsole {
    #counters = new Map<string, number>();
    #timers = new Map<string | undefined, number>();
    #indentation = '';

    assert(condition?: boolean, message?: string, ...optionalParams: unknown[]) {
        if (!condition) {
            if (message === undefined) {
                this.error('Assertion failed')
            }
            else {
                this.error('Assertion failed:', format(message, ...optionalParams));
            }
        }
    }

    clear() { }

    count(label?: string) {
        let value = this.#counters.get(label ?? 'default');
        if (value === undefined) {
            value = 0;
        }
        value++;
        this.#counters.set(label ?? 'default', value);

        this.log('%s: %s', label ?? 'default', value.toString());
    }

    countReset(label?: string) {
        this.#counters.set(label ?? 'default', 0);
    }

    debug(message?: string, ...optionalParams: unknown[]) {
        this.log(message, ...optionalParams);
    }

    dir(item?: unknown, options?: InspectOptions) {
        this.log('%s', inspect(item, { ...options, colors: false, customInspect: false }));
    }

    dirxml(message?: string, ...optionalParams: unknown[]) {
        this.log(message, ...optionalParams);
    }

    error(message?: string, ...optionalParams: unknown[]) {
        log.error(this.#indentation + format(message, ...optionalParams));
    }

    group(...label: unknown[]) {
        if (label.length > 0) {
            log.info(this.#indentation + label.map(l => typeof l === 'string' ? l : inspect(l)).join(' '));
        }
        this.#indentation = this.#indentation + '  ';
    }

    groupCollapsed(...label: unknown[]) {
        this.group(...label);
    }

    groupEnd() {
        if (this.#indentation !== '') {
            this.#indentation = this.#indentation.substring(0, this.#indentation.length - 2);
        }
    }

    info(message?: string, ...optionalParams: unknown[]) {
        this.log(message, ...optionalParams);
    }

    log(message?: string, ...optionalParams: unknown[]) {
        log.info(this.#indentation + format(message, ...optionalParams));
    }

    table() {
        throw new Error('Function not implemented.');
    }

    time(label?: string) {
        this.#timers.set(label, Date.now());
    }

    timeEnd(label?: string) {
        const start = this.#timers.get(label);
        if (start === undefined) {
            return;
        }
        this.#timers.delete(label);
        const elapsed = Date.now() - start;

        const elapsedText = elapsed < 1000 ? `${elapsed}ms` : `${elapsed / 1000}s`;

        if (label === undefined) {
            log.info(this.#indentation + elapsedText);
        }
        else {
            log.info(this.#indentation + (typeof label === 'string' ? label : inspect(label)) + ':', elapsedText);
        }
    }

    timeLog(label?: string, ...data: unknown[]) {
        const start = this.#timers.get(label);
        if (start === undefined) {
            return;
        }
        const elapsed = Date.now() - start;

        const elapsedText = elapsed < 1000 ? `${elapsed}ms` : `${elapsed / 1000}s`;

        if (label === undefined) {
            log.info(this.#indentation + elapsedText, ...data);
        }
        else {
            log.info(this.#indentation + (typeof label === 'string' ? label : inspect(label)) + ':', elapsedText, ...data);
        }
    }

    timeStamp() {
        throw new Error('Function not implemented.');
    }

    trace(message?: string, ...optionalParams: unknown[]) {
        this.log('Trace:', format(message, ...optionalParams));
        const trace = {};
        Error.captureStackTrace(trace, this.trace);
        const stack = (trace as { stack: string }).stack;
        const frames = stack.split('\n');
        for (let i = 1; i < frames.length; i++) {
            this.log(frames[i]);
        }
    }

    warn(message?: string, ...optionalParams: unknown[]) {
        log.warning(this.#indentation + format(message, ...optionalParams));
    }

    profile(): void {
        throw new Error('Function not implemented.');
    }

    profileEnd(): void {
        throw new Error('Function not implemented.');
    }
};

const globalThisTyped = globalThis as unknown as {
    console: CustomConsole;
    addEventListener<T extends Event>(event: string, callback: (e: T) => void): void;
};

globalThisTyped.console = new CustomConsole();
globalThisTyped.addEventListener('unhandledrejection', (e: { promise: Promise<unknown>, reason: unknown } & Event) => {
    console.error(`unhandled rejection at: ${inspect(e.promise)}\nreason: ${inspect(e.reason)}`);
    e.preventDefault();
});

export class internal__NekoRuntimeImpl implements NekoRuntime {
    #accessToken: string;
    #destroy: () => void;

    private constructor(public rpc: NekoRpc, destroy: () => void, accessToken: string) {
        this.#destroy = destroy;
        this.#accessToken = accessToken;
    }

    #onConnectionClosed() {
        this.#destroy();
    }

    static async create() {
        const [transport, name, accessToken] = process.argv.slice(2);
        if (transport === undefined || name === undefined || accessToken === undefined) {
            throw 'Invalid command line arguments';
        }

        const { rpc, destroy } = await NekoRpc.create(transport as TransportType, name, () => runtime.#onConnectionClosed());
        const runtime = new internal__NekoRuntimeImpl(rpc, destroy, accessToken);
        await runtime.#run();
        return runtime;
    }

    async #run() {
        await this.rpc.send({
            $type: 'Authenticate',
            clientType: 'Script',
            accessToken: this.#accessToken,
        });
    }

    stop() {
        this.#destroy();
    }
}

let isInitialized: boolean = false;
let runtime: internal__NekoRuntimeImpl | null = null;

export default {
    async init() {
        if (isInitialized) {
            throw 'Runtime has already been initialized';
        }

        isInitialized = true;
        return runtime = await internal__NekoRuntimeImpl.create();
    },

    get() {
        if (!isInitialized || runtime === null) {
            throw 'You need to initialize the runtime first';
        }

        return runtime;
    },
};
