import { createContext, useContext } from 'react';
import { ProxyDto } from '../api/dtos.gen';

export interface ProxiesContextType {
    state: {
        list: ProxyDto[] | null;
    };
    actions: {
        added: (script: ProxyDto) => void;
        updated: (script: ProxyDto) => void;
        deleted: (id: string) => void;
    };
}

export const ProxiesContext = createContext<ProxiesContextType | null>(null);

export const useProxies = () => useContext(ProxiesContext);
