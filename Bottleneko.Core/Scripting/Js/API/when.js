import log from './log';
const subscribe = function (event, callback) {
    const token = __Api.Subscribe(event, callback);
    return {
        cancel: () => __Api.Unsubscribe(token),
    };
};
const flattenFilter = (filter, start, prefix) => {
    const result = start ?? {};
    for (const key of Object.keys(filter)) {
        const subfilter = filter[key];
        if (subfilter !== null && typeof subfilter === 'object' && !__Api.IsEnum(subfilter) && !(subfilter instanceof RegExp)) {
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
const makeEvent = function (event, defaultFilter) {
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
                        log.warning(`Failed to apply event filter: ${subfilter.path} is not a string`);
                        return;
                    }
                    if (!subfilter.comparison.test(value)) {
                        return;
                    }
                }
                else if (typeof subfilter.comparison === 'string' || typeof subfilter.comparison === 'number' || typeof subfilter.comparison === 'boolean' || typeof subfilter.comparison === 'bigint') {
                    if (typeof value !== typeof subfilter.comparison) {
                        log.warning(`Failed to apply event filter: ${subfilter.path} is not a ${typeof subfilter.comparison}`);
                        return;
                    }
                    if (subfilter.comparison !== value) {
                        return;
                    }
                }
                else if (__Api.IsEnum(subfilter.comparison)) {
                    if (typeof value !== typeof subfilter.comparison) {
                        log.warning(`Failed to apply event filter: ${subfilter.path} is not a enum value`);
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
                    log.warning(`Failed to apply event filter: ${typeof subfilter.comparison} is not supported as a filter`);
                    return;
                }
            }
            return callback(msg);
        });
    };
};
export default {
    connection: {
        messageReceived: makeEvent('connection/message_received', { 'flags.isSpecial': false, 'flags.isOffline': false }),
    },
};
