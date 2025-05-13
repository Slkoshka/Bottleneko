import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useFetchData } from '../../app/hooks';
import api from '../api';
import { ScriptDto } from '../api/dtos.gen';
import { ScriptsContext } from './context';

export default function ScriptsProvider({ children }: { children?: ReactNode | undefined }) {
    const [list, setList] = useState<ScriptDto[] | null>(null);

    const added = useCallback((script: ScriptDto) => {
        if (list !== null) {
            setList([...list, script]);
        }
    }, [list]);

    const updated = useCallback((script: ScriptDto) => {
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

    const [remoteList] = useFetchData(useCallback(() => api.scripts.list(), []), true, 3000);

    useEffect(() => {
        if (remoteList) {
            setList(remoteList.scripts);
        }
    }, [remoteList]);

    return (
        <ScriptsContext.Provider value={value}>
            {children}
        </ScriptsContext.Provider>
    );
};
