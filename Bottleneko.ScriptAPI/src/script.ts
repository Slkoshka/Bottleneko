export default {
    name: __Api.ScriptName as string,

    stop: () => {
        __Api.Stop();
    },
};
