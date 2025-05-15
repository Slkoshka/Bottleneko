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

    const subscribe = (event, callback) => {
        const token = api.Subscribe(event, (name, event) => {
            callback(name, event);
        });
        return {
            cancel: () => api.Unsubscribe(token),
        };
    };

    const flattenFilter = (filter, start, prefix) => {
        const result = start ?? {};
        for (const key of Object.keys(filter)) {
            const subfilter = filter[key];
            if (subfilter !== null && typeof subfilter === 'object' && !api.IsEnum(subfilter) && !(subfilter instanceof RegExp)) {
                flattenFilter(subfilter, result, prefix ? (`${prefix}${key}.`) : (key + '.'));
            }
            else {
                result[prefix ? prefix + key : key] = subfilter;
            }
        }
        return result;
    };

    const extractValue = (obj, path) => {
        for (const part of path) {
            obj = obj[part];
            if (obj === undefined || obj === null) {
                return obj;
            }
        }

        return obj;
    };

    const makeEvent = (event, defaultFilter) => {
        defaultFilter = flattenFilter(defaultFilter);
        return (callback, filter) => {
            if (typeof filter === 'function') {
                return subscribe(event, (_, msg) => {
                    if (filter(msg)) {
                        return callback(msg);
                    }
                });
            }
            else if (filter === undefined) {
                filter = {};
            }
            else if (filter === null) {
                return subscribe(event, (_, msg) => {
                    return callback(msg);
                });
            }

            const merged = { ...defaultFilter, ...flattenFilter(filter) };
            const filterList = Object.keys(merged).filter(key => merged[key] !== null && merged[key] !== undefined).map(key => ({
                path: key,
                pathParts: key.split('.'),
                comparison: merged[key],
            }));

            return subscribe(event, (_, msg) => {
                for (const subfilter of filterList) {
                    const value = extractValue(msg, subfilter.pathParts);
                    if (subfilter.comparison instanceof RegExp) {
                        if (typeof value !== 'string') {
                            log(core.Bottleneko.Logging.LogSeverity.Warning, [`Failed to apply event filter: ${subfilter.path} is not a string`]);
                            return;
                        }
                        if (!subfilter.comparison.test(value)) {
                            return;
                        }
                    }
                    else if (typeof subfilter.comparison === 'string' || typeof subfilter.comparison === 'number' || typeof subfilter.comparison === 'boolean' || typeof subfilter.comparison === 'bigint') {
                        if (typeof value !== typeof subfilter.comparison) {
                            log(core.Bottleneko.Logging.LogSeverity.Warning, [`Failed to apply event filter: ${subfilter.path} is not a ${typeof subfilter.comparison}`]);
                            return;
                        }

                        if (subfilter.comparison !== value) {
                            return;
                        }
                    }
                    else if (api.IsEnum(subfilter.comparison)) {
                        if (typeof value !== typeof subfilter.comparison) {
                            log(core.Bottleneko.Logging.LogSeverity.Warning, [`Failed to apply event filter: ${subfilter.path} is not a enum value`]);
                            return;
                        }

                        if (subfilter.comparison !== value) {
                            return;
                        }
                    }
                    else if (typeof subfilter.comparison === 'function') {
                        if (!subfilter.comparison(value)) {
                            return;
                        }
                    }
                    else {
                        log(core.Bottleneko.Logging.LogSeverity.Warning, [`Failed to apply event filter: ${typeof subfilter.comparison} is not supported as a filter`]);
                        return;
                    }
                }

                return callback(msg);
            });
        };
    };
    
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

        wait: api.Wait,

        log: {
            critical: (...args) => log(core.Bottleneko.Logging.LogSeverity.Critical, args),
            error: (...args) => log(core.Bottleneko.Logging.LogSeverity.Error, args),
            warning: (...args) => log(core.Bottleneko.Logging.LogSeverity.Warning, args),
            info: (...args) => log(core.Bottleneko.Logging.LogSeverity.Info, args),
            verbose: (...args) => log(core.Bottleneko.Logging.LogSeverity.Verbose, args),
            debug: (...args) => log(core.Bottleneko.Logging.LogSeverity.Debug, args),
        },

        when: {
            connection: {
                messageReceived: makeEvent('connection/message_received', { 'flags.isSpecial': false, 'flags.isOffline': false }),
            },
        },
    };
}());

const log = neko.log;
const when = neko.when;
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
