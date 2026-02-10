import process from 'node:process';
import NekoRpc, { type TransportType } from './internal/rpc/index.ts';

class NekoRuntimeImpl {
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
        const runtime = new NekoRuntimeImpl(rpc, destroy, accessToken);
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

export default await NekoRuntimeImpl.create();

type ExtractTypeFromPromise<Type> = Type extends Promise<infer X> ? X : never
export type NekoRuntime = ExtractTypeFromPromise<ReturnType<typeof NekoRuntimeImpl.create>>;
