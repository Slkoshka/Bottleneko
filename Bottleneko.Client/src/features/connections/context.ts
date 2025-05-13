import { createContext, useContext } from 'react';
import { AnyConnectionDto } from '.';

export interface ConnectionsContextType {
    state: {
        list: AnyConnectionDto[] | null;
    };
    actions: {
        added: (connection: AnyConnectionDto) => void;
        updated: (connection: AnyConnectionDto) => void;
        deleted: (id: string) => void;
    };
}

export const ConnectionsContext = createContext<ConnectionsContextType | null>(null);

export const useConnections = () => useContext(ConnectionsContext);
