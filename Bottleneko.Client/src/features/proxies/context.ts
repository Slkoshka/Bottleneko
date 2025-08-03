import { createContext, useContext } from 'react';
import { ProxyDto } from '../api/dtos.gen';
import { EntityConfig, EntityContextData } from '../../app/EntityProvider';
import api from '../api';
import { ProxyState } from './ProxiesProvider';

interface ExtraActions {
    add: typeof api.proxies.add;
}

export type ProxyEntityConfig = EntityConfig<ProxyDto, Parameters<typeof api.proxies.update>[1], ProxyState>;
export type ProxiesContextType = EntityContextData<ProxyEntityConfig> & { actions: ExtraActions };

export const ProxiesContext = createContext<ProxiesContextType | null>(null);

export const useProxies = () => useContext(ProxiesContext);
