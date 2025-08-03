import { ReactNode, useCallback } from 'react';
import api from '../api';
import { ProxyDto } from '../api/dtos.gen';
import { EntityState, useEntityProvider } from '../../app/EntityProvider';
import { ProxiesContext, ProxyEntityConfig } from './context';
import { proxyTypeMap } from '.';

export class ProxyState extends EntityState<ProxyDto, Parameters<typeof api.proxies.update>[1]> {
    get info() {
        return {
            id: {
                name: 'ID',
                value: this.data.id,
            },
            name: {
                name: 'Name',
                value: this.data.name,
            },
            type: {
                name: 'Type',
                value: proxyTypeMap[this.data.type].name,
            },
            address: {
                name: 'Address',
                value: `${this.data.hostname}:${this.data.port.toString()}`,
            },
        };
    }
}

export default function ProxiesProvider({ children }: { children?: ReactNode | undefined }) {
    const factory = useCallback((entity: ProxyDto, updated: () => void) => new ProxyState(api.proxies, entity, updated), []);
    const { data } = useEntityProvider<ProxyEntityConfig>('proxy', api.proxies, factory);

    const add = useCallback(async (parameters: Parameters<typeof api.proxies.add>[0]) => {
        const result = await api.proxies.add(parameters);
        data.actions.added(result.result);
        return result;
    }, [data]);

    return (
        <ProxiesContext.Provider
            value={{
                ...data,
                actions: {
                    add,
                    ...data.actions,
                },
            }}
        >
            {children}
        </ProxiesContext.Provider>
    );
};
