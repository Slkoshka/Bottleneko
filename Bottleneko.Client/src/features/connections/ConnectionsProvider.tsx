import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useFetchData } from '../../app/hooks';
import api from '../api';
import { ConnectionsContext } from './context';
import { AnyConnectionDto } from '.';

export default function ConnectionsProvider({ children }: { children?: ReactNode | undefined }) {
    const [list, setList] = useState<AnyConnectionDto[] | null>(null);

    const added = useCallback((connection: AnyConnectionDto) => {
        if (list !== null) {
            setList([...list, connection]);
        }
    }, [list]);

    const updated = useCallback((connection: AnyConnectionDto) => {
        if (list !== null) {
            setList(list.map(c => c.id !== connection.id ? c : connection));
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

    const [remoteList] = useFetchData(useCallback(() => api.connections.list(), []), true, 3000);

    useEffect(() => {
        if (remoteList) {
            setList(remoteList.connections);
        }
    }, [remoteList]);

    return (
        <ConnectionsContext.Provider value={value}>
            {children}
        </ConnectionsContext.Provider>
    );
};
