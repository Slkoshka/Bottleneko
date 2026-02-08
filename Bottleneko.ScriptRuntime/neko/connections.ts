import type { ConnectionDto } from "./internal/api/bottleneko.gen.ts";
import runtime, { type NekoRuntime } from './runtime.ts';

class Connections {
    #runtime: NekoRuntime;

    constructor(runtime: NekoRuntime) {
        this.#runtime = runtime;
    }

    async get(id: ConnectionDto['id']) {
        return await this.#runtime.rpc.connections.get({ id });
    }

    async list() {
        return await this.#runtime.rpc.connections.list({ });
    }
}

export default new Connections(runtime);
