import runtime from './runtime.ts';
import type { LogSeverity } from './api/bottleneko.gen.ts';

const sendLog = (severity: LogSeverity, args: unknown[]) => {
    void runtime.get().rpc.logging.log({
        severity,
        message: args.map(item => {
            switch (item) {
                case null:
                    return 'null';

                case undefined:
                    return 'undefined';

                default:
                    if (typeof item === 'function') {
                        return '<function>';
                    }
                    else if (typeof item === 'object') {
                        if (item instanceof Error) {
                            return item.stack;
                        }
                        
                        const asString = item!.toString();
                        if (asString !== '[object Object]') {
                            return asString;
                        }

                        try {
                            return JSON.stringify(item, (_, item) => {
                                switch (typeof item) {
                                    case 'bigint':
                                        return item.toString();

                                    case 'object':
                                        {
                                            if (item === null) {
                                                return item;
                                            }
                                            else if (item instanceof Error) {
                                                return item.stack;
                                            }

                                            const asString = item!.toString();
                                            if (asString !== '[object Object]') {
                                                return asString;
                                            }
                                            return item;
                                        }

                                    case 'undefined':
                                        return '<undefined>';

                                    case 'function':
                                        return '<function>';

                                    case 'number':
                                    case 'boolean':
                                    case 'string':
                                    default:
                                        return item;
                                }
                            }, 2);
                        } catch {
                            return item!.toString();
                        }
                    } else {
                        return item!.toString();
                    }
            }
        }).join(' '),
    });
}

export default {
    critical(...args: unknown[]) { sendLog('Critical', args); },
    error(...args: unknown[]) { sendLog('Error', args); },
    warning(...args: unknown[]) { sendLog('Warning', args); },
    info(...args: unknown[]) { sendLog('Info', args); },
    verbose(...args: unknown[]) { sendLog('Verbose', args); },
    debug(...args: unknown[]) { sendLog('Debug', args); },
};
