import { createContext, useContext } from 'react';
import { ScriptDto } from '../api/dtos.gen';

export interface ScriptsContextType {
    state: {
        list: ScriptDto[] | null;
    };
    actions: {
        added: (script: ScriptDto) => void;
        updated: (script: ScriptDto) => void;
        deleted: (id: string) => void;
    };
}

export const ScriptsContext = createContext<ScriptsContextType | null>(null);

export const useScripts = () => useContext(ScriptsContext);
