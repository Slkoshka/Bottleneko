import process from 'node:process';
import NekoRpc, { type TransportType } from './rpc/index.ts';
import type { NekoRuntime } from '../runtime.ts';

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
