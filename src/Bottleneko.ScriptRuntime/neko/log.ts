import runtime, { type NekoRuntime } from './runtime.ts';
import type { LogSeverity } from './internal/api/bottleneko.gen.ts';

class Log {
    #runtime: NekoRuntime;

    constructor(runtime: NekoRuntime) {
        this.#runtime = runtime;
    }

    #sendLog(severity: LogSeverity, args: unknown[]) {
        void this.#runtime.rpc.logging.log({
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

    critical(...args: unknown[]) { this.#sendLog('Critical', args); }
    error(...args: unknown[]) { this.#sendLog('Error', args); }
    warning(...args: unknown[]) { this.#sendLog('Warning', args); }
    info(...args: unknown[]) { this.#sendLog('Info', args); }
    verbose(...args: unknown[]) { this.#sendLog('Verbose', args); }
    debug(...args: unknown[]) { this.#sendLog('Debug', args); }
}

export default new Log(runtime);
