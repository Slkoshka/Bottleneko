const implementation = (severity, args) => __Api.Log(severity, 'Script', args.map(item => {
    switch (item) {
        case null:
            return 'null';
        case undefined:
            return 'undefined';
        default:
            if (typeof item === 'object') {
                if (__Api.IsEnum(item)) {
                    return item.ToString();
                }
                try {
                    return JSON.stringify(item, (_, item) => {
                        return typeof item === 'bigint' ? item.toString() : __Api.IsEnum(item) ? item.ToString() : item;
                    }, 2);
                }
                catch {
                    return item.toString();
                }
            }
            else {
                return item;
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
