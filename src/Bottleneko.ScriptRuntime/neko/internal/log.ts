import runtime from './runtime.ts';
import type { LogSeverity } from './api/bottleneko.gen.ts';
import { inspect } from 'node:util';

const sendLog = (severity: LogSeverity, args: unknown[]) => {
    void runtime.get().rpc.logging.log({
        severity,
        message: args.map(arg => typeof arg === 'string' ? arg : inspect(arg)).join(' '),
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
