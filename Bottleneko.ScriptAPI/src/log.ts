const implementation = (severity: LogSeverity, args: unknown[]): void => __Api.Log(severity, 'Script', args.map(item => {
    switch (item) {
        case null:
            return 'null';

        case undefined:
            return 'undefined';

        default:
            if (typeof item === 'object') {
                if (__Api.IsEnum(item)) {
                    return (item as EnumValue<unknown>).ToString();
                }

                try {
                    return JSON.stringify(item, (_, item) => {
                        return typeof item === 'bigint' ? item.toString() : __Api.IsEnum(item) ? item.ToString() : item;
                    }, 2);
                } catch {
                    return item!.toString();
                }
            } else {
                return item;
            }
    }
}).join(' '));

export default {
    critical: (...args: unknown[]) => implementation(__Core.Bottleneko.Logging.LogSeverity.Critical, args),
    error: (...args: unknown[]) => implementation(__Core.Bottleneko.Logging.LogSeverity.Error, args),
    warning: (...args: unknown[]) => implementation(__Core.Bottleneko.Logging.LogSeverity.Warning, args),
    info: (...args: unknown[]) => implementation(__Core.Bottleneko.Logging.LogSeverity.Info, args),
    verbose: (...args: unknown[]) => implementation(__Core.Bottleneko.Logging.LogSeverity.Verbose, args),
    debug: (...args: unknown[]) => implementation(__Core.Bottleneko.Logging.LogSeverity.Debug, args),
};
