import log from './log';

const subscribe = function<T>(event: string, callback: (name: string, event: T) => Promise<unknown> | undefined) {
    const token = __Api.Subscribe(event, callback as any);
    return {
        cancel: (): void => __Api.Unsubscribe(token),
    };
};

class FilterDefinition {
    path: string[];
    comparison: any;

    constructor(path: string[], comparison: any) {
        this.path = path;
        this.comparison = comparison;
    }
}

const flattenFilters = (filters: Record<string, any>, start?: FilterDefinition[], path?: string[]) => {
    const result: FilterDefinition[] = start ?? [];
    path = path ?? [];
    for (const [key, filter] of Object.entries(filters)) {
        if (filter instanceof FilterDefinition) {
            result.push(new FilterDefinition([...path, ...key.split('.')], filter.comparison));
        }
        else if (filter !== null && typeof filter === 'object' && !__Api.IsEnum(filter) && !(filter instanceof RegExp)) {
            flattenFilters(filter, result, [...path, ...key.split('.')]);
        }
        else {
            result.push(new FilterDefinition([...path, ...key.split('.')], filter));
        }
    }
    return result;
};

const setValueByPath = (target: Record<string, object>, path: string[], value: any) => {
    for (let i = 0; i < path.length; i++) {
        if (i === path.length - 1) {
            target[path[i]] = value;
        }
        else {
            if (!Object.hasOwn(target, path[i]) || target[path[i]] instanceof FilterDefinition) {
                target[path[i]] = { };
            }
            target = target[path[i]] as Record<string, object>;
        }
    }
};

const expandFilters = (filters: FilterDefinition[]) => {
    const result: Record<string, FilterDefinition | object> = {};
    for (const filter of filters) {
        setValueByPath(result, filter.path, filter);
    }
    return result;
};

const extractValue = (obj: any, path: string[]) => {
    for (const part of path) {
        if (typeof obj !== 'object') {
            return undefined;
        }

        obj = obj[part];
    }
    return obj;
};

type EventFilterCallback<T> = (msg: T) => boolean;
type EventFilter<T> = object | EventFilterCallback<T>;
type EventCallback<T> = ((msg: T) => Promise<unknown> | undefined);

const matchFilter = function(value: any, filter: FilterDefinition) {
    if (filter.comparison === 'undefined') {
        return true;
    }
    else if (filter.comparison instanceof RegExp) {
        if (value === null) {
            return false;
        }

        if (typeof value !== 'string') {
            log.warning(`Failed to apply event filter: '${filter.path.join('.')}' is not a string`);
            return false;
        }
        if (!filter.comparison.test(value)) {
            return false;
        }
    }
    else if (typeof filter.comparison === 'string' || typeof filter.comparison === 'number' || typeof filter.comparison === 'boolean' || typeof filter.comparison === 'bigint') {
        if (value === null) {
            return false;
        }

        if (typeof value !== typeof filter.comparison) {
            log.warning(`Failed to apply event filter: '${filter.path.join('.')}' is not a ${typeof filter.comparison}`);
            return false;
        }

        if (filter.comparison !== value) {
            return false;
        }
    }
    else if (__Api.IsEnum(filter.comparison)) {
        if (value === null) {
            return false;
        }

        if (typeof value !== typeof filter.comparison) {
            log.warning(`Failed to apply event filter: '${filter.path.join('.')}' is not a enum value`);
            return false;
        }

        if (filter.comparison !== value) {
            return false;
        }
    }
    else if (typeof filter.comparison === 'function') {
        if (!filter.comparison(value)) {
            return false;
        }
    }
    else if (filter.comparison === null) {
        if (value !== null) {
            return false;
        }
    }
    else {
        log.warning(`Failed to apply event filter: ${typeof filter.comparison} is not supported as a filter`);
        return false;
    }

    return true;
};

const makeEvent = function<T>(event: string, defaultFilter: EventFilter<T>): (callback: EventCallback<T>, filter?: EventFilter<T>) => void {
    const defaultFilterFlattened = flattenFilters(defaultFilter);
    return (callback, filter) => {
        if (typeof filter === 'function') {
            return subscribe<T>(event, (_, msg) => {
                if ((filter as EventFilterCallback<T>)(msg)) {
                    return callback(msg);
                }
            });
        }
        else if (filter === undefined) {
            filter = {};
        }
        else if (filter === null) {
            return subscribe<T>(event, (_, msg) => {
                return callback(msg);
            });
        }

        const merged = flattenFilters(expandFilters([ ...defaultFilterFlattened, ...flattenFilters(filter) ]));

        return subscribe(event, (_, msg) => {
            for (const filter of Object.values(merged)) {
                if (!matchFilter(extractValue(msg as any, filter.path), filter)) {
                    return;
                }
            }

            return callback(msg as any);
        });
    };
};

export default {
    connection: {
        messageReceived: makeEvent<ChatMessage>('connection/message_received', { 'flags.isSpecial': false, 'flags.isOffline': false }),
    },
};
