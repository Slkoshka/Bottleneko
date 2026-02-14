import runtime from './runtime.ts';

export default {
    async getId() {
        return await runtime.get().rpc.script.getId({});
    },

    async getName() {
        return await runtime.get().rpc.script.getName({});
    },

    stop() {
        runtime.get().stop();
    },
};
