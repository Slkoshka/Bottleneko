import { createContext, useContext } from 'react';
import { ConnectionDto } from '../api/dtos.gen';
import api from '../api';
import { EntityConfig, EntityContextData } from '../../app/EntityProvider';
import { ConnectionState } from './ConnectionsProvider';

interface ExtraActions {
    add: typeof api.connections.add;
}

export type ConnectionEntityConfig = EntityConfig<ConnectionDto, Parameters<typeof api.connections.update>[1], ConnectionState>;
export type ConnectionsContextType = EntityContextData<ConnectionEntityConfig> & { actions: ExtraActions };

export const ConnectionsContext = createContext<ConnectionsContextType | null>(null);

export const useConnections = () => useContext(ConnectionsContext);
