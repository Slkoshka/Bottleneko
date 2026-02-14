import { internal__NekoRuntimeImpl } from './internal/export.ts';

export interface NekoRuntime {
    stop: () => void;
}

export interface Runtime {
    init: () => Promise<NekoRuntime>;
    get: () => NekoRuntime;
}

export default internal__NekoRuntimeImpl as Runtime;
