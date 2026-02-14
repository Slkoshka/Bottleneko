import { internal__LogImpl } from './internal/export.ts';

export interface Log {
    critical: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    warning: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    verbose: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
}

export default internal__LogImpl as Log;
