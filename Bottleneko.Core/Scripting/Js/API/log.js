const implementation = (severity, args) => __Api.Log(severity, 'Script', args.map(item => {
    switch (item) {
        case null:
            return 'null';
        case undefined:
            return 'undefined';
        default:
            if (typeof item === 'function') {
                try {
                    return __Api.GetTypeName(item);
                }
                catch { }
                return '<function>';
            }
            else if (typeof item === 'object') {
                if (__Api.IsEnum(item)) {
                    return item.ToString();
                }
                if (item instanceof Error) {
                    return item.stack;
                }
                const asString = item.toString();
                if (asString !== '[object Object]') {
                    return asString;
                }
                try {
                    return JSON.stringify(item, (_, item) => {
                        switch (typeof item) {
                            case 'bigint':
                                return item.toString();
                            case 'object':
                                if (item === null) {
                                    return item;
                                }
                                else if (__Api.IsEnum(item)) {
                                    return item.ToString();
                                }
                                else if (item instanceof Error) {
                                    return item.stack;
                                }
                                const asString = item.toString();
                                if (asString !== '[object Object]') {
                                    return asString;
                                }
                                return item;
                            case 'undefined':
                                return '<undefined>';
                            case 'function':
                                try {
                                    return __Api.GetTypeName(item);
                                }
                                catch { }
                                return '<function>';
                            case 'number':
                            case 'boolean':
                            case 'string':
                            default:
                                return item;
                        }
                    }, 2);
                }
                catch {
                    return item.toString();
                }
            }
            else {
                return item.toString();
            }
    }
}).join(' '));
export default {
    critical: (...args) => implementation(__Core.Bottleneko.Logging.LogSeverity.Critical, args),
    error: (...args) => implementation(__Core.Bottleneko.Logging.LogSeverity.Error, args),
    warning: (...args) => implementation(__Core.Bottleneko.Logging.LogSeverity.Warning, args),
    info: (...args) => implementation(__Core.Bottleneko.Logging.LogSeverity.Info, args),
    verbose: (...args) => implementation(__Core.Bottleneko.Logging.LogSeverity.Verbose, args),
    debug: (...args) => implementation(__Core.Bottleneko.Logging.LogSeverity.Debug, args),
};
