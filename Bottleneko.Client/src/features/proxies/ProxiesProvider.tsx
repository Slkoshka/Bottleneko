import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useFetchData } from '../../app/hooks';
import api from '../api';
import { ProxyDto } from '../api/dtos.gen';
import { ProxiesContext } from './context';

export default function ScriptsProvider({ children }: { children?: ReactNode | undefined }) {
    const [list, setList] = useState<ProxyDto[] | null>(null);

    const added = useCallback((script: ProxyDto) => {
        if (list !== null) {
            setList([...list, script]);
        }
    }, [list]);

    const updated = useCallback((script: ProxyDto) => {
        if (list !== null) {
            setList(list.map(c => c.id !== script.id ? c : script));
        }
    }, [list]);

    const deleted = useCallback((id: string) => {
        if (list !== null) {
            setList(list.filter(c => c.id !== id));
        }
    }, [list]);

    const value = {
        state: {
            list,
        },
        actions: {
            added,
            updated,
            deleted,
        },
    };

    const [remoteList] = useFetchData(useCallback(() => api.proxies.list(), []), true, 3000);

    useEffect(() => {
        if (remoteList) {
            setList(remoteList.proxies);
        }
    }, [remoteList]);

    return (
        <ProxiesContext.Provider value={value}>
            {children}
        </ProxiesContext.Provider>
    );
};
