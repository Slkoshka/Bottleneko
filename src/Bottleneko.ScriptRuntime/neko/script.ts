import runtime, { type NekoRuntime } from './runtime.ts';

class Script {
    #runtime: NekoRuntime;

    constructor(runtime: NekoRuntime) {
        this.#runtime = runtime;
    }

    async getId() {
        return await this.#runtime.rpc.script.getId({});
    }

    async getName() {
        return await this.#runtime.rpc.script.getName({});
    }

    stop() {
        this.#runtime.stop();
    }
}

export default new Script(runtime);

