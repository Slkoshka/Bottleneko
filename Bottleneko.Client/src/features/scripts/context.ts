import { createContext, useContext } from 'react';
import { ScriptDto } from '../api/dtos.gen';
import api from '../api';
import { EntityConfig, EntityContextData } from '../../app/EntityProvider';
import { ScriptState } from './ScriptsProvider';

interface ExtraActions {
    add: typeof api.scripts.add;
}

export type ScriptEntityConfig = EntityConfig<ScriptDto, Parameters<typeof api.scripts.update>[1], ScriptState>;
export type ScriptsContextType = EntityContextData<ScriptEntityConfig> & { actions: ExtraActions };

export const ScriptsContext = createContext<ScriptsContextType | null>(null);

export const useScripts = () => useContext(ScriptsContext);
