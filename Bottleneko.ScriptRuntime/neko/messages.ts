import type { ChatMessageDto, ChatMessageFilter, ChatMessageLetter } from "./internal/api/bottleneko.gen.ts";
import type NekoRpc from "./internal/rpc/index.ts";
import runtime, { type NekoRuntime } from './runtime.ts';

const makeListener = (rpc: NekoRpc, callback: (message: ChatMessageDto) => Promise<void> | void, filter: ChatMessageFilter) => {
    return rpc.watch(
        [{ filter: filter ?? { connectionId: null, protocol: null } }],
        rpc.messages.subscribe,
        rpc.messages.unsubscribe,
        (letter) => callback((letter as ChatMessageLetter).content)
    );
};

class Messages {
    #runtime: NekoRuntime;

    constructor(runtime: NekoRuntime) {
        this.#runtime = runtime;
    }

    get received() {
        return {
            listen: (callback: Parameters<typeof makeListener>[1]) => makeListener(this.#runtime.rpc, callback, { connectionId: null, protocol: null }),

            filteredBy: (filter: ChatMessageFilter) => {
                return {
                    listen: (callback: Parameters<typeof makeListener>[1]) => makeListener(this.#runtime.rpc, callback, filter),
                };
            },
        }
    }
}

export default new Messages(runtime);
