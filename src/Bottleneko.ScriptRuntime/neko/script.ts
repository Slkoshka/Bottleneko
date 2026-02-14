import { internal__ScriptImpl } from './internal/export.ts';

export interface Script {
    getId: () => Promise<string>;
    getName: () => Promise<string>;
    stop: () => void;
}

export default internal__ScriptImpl as Script;
