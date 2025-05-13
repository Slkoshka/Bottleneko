const neko = (function () {
    const api = __Api;
    const host = __Host;
    const core = __Core;
    
    delete __Api;
    delete __Host;
    delete __Core;

    const log = (severity, args) => api.Log(severity, 'Script', args.map(item => {
        switch (item) {
            case null:
                return 'null';

            case undefined:
                return 'undefined';

            default:
                if (typeof item === 'object') {
                    if (api.IsEnum(item)) {
                        return item.ToString();
                    }

                    try {
                        return JSON.stringify(item, (_, item) => {
                            return typeof item === 'bigint' ? item.toString() : api.IsEnum(item) ? item.ToString() : item;
                        }, 2);
                    } catch {
                        return item.toString();
                    }
                } else {
                    return item;
                }
        }
    }).join(' '));
    
    return {
        script: {
            name: api.ScriptName,

            stop: () => {
                api.Stop();
            },
        },

        connections: {
            get: async (id) => {
                return await api.GetConnection(id);
            },
        },

        types: {
            Protocol: core.Bottleneko.Api.Dtos.Protocol,
            ConnectionStatus: core.Bottleneko.Api.Dtos.ConnectionStatus,
            DiscordChannelType: core.Bottleneko.Scripting.Bindings.Discord.DiscordChannelType,
        },

        on: (event, callback) => {
            const token = api.Subscribe(event, (name, event) => {
                callback(name, event);
            });
            return {
                cancel: () => api.Unsubscribe(token),
            };
        },

        wait: api.Wait,

        log: {
            critical: (...args) => log(core.Bottleneko.Logging.LogSeverity.Critical, args),
            error: (...args) => log(core.Bottleneko.Logging.LogSeverity.Error, args),
            warning: (...args) => log(core.Bottleneko.Logging.LogSeverity.Warning, args),
            info: (...args) => log(core.Bottleneko.Logging.LogSeverity.Info, args),
            verbose: (...args) => log(core.Bottleneko.Logging.LogSeverity.Verbose, args),
            debug: (...args) => log(core.Bottleneko.Logging.LogSeverity.Debug, args),
        },
    };
}());

const log = neko.log;
const { setInterval, setTimeout, clearInterval } = (function () {
    let lastTimeout = 0;
    const timers = new Set();

    return {
        setInterval: function (callback, interval, ...args) {
            const id = ++lastTimeout;
            timers.add(id);

            const f = () => {
                if (timers.has(id)) {
                    try {
                        callback(...args);
                    } finally {
                        neko.wait(interval).then(f);
                    }
                }
            };

            neko.wait(interval).then(f);

            return id;
        },

        setTimeout: function (callback, delay, ...args) {
            const id = ++lastTimeout;
            timers.add(id);

            const f = () => {
                if (timers.has(id)) {
                    try {
                        callback(...args);
                    } finally {
                        timers.delete(id);
                    }
                }
            };

            neko.wait(interval).then(f);

            return id;
        },

        clearInterval: function (id) {
            timers.delete(id);
        },

        clearTimeout: function (id) {
            timers.delete(id);
        },
    }
}());
