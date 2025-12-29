import { EffectCallback, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { RequestError } from '../features/api/errors';
import { ErrorCode } from '../features/api/responses';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { EntityApi, EntityConfig, EntityContextData } from './EntityProvider';

export function useOnce(effect: EffectCallback) {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            effect();
        }
    });
}

export function useInterval(callback: () => void, delay: number | null) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        const tick = () => {
            savedCallback.current();
        };

        if (typeof delay === 'number') {
            intervalRef.current = setInterval(tick, delay);
            return () => {
                clearInterval(intervalRef.current);
            };
        }
    }, [delay]);
    return intervalRef;
}

export function useAsync<T extends unknown[]>(callback: (...args: T) => Promise<void>): [(...args: T) => Promise<void>, boolean] {
    const [isLoading, setIsLoading] = useState(false);
    const call = useCallback(async (...args: T) => {
        setIsLoading(true);
        try {
            await callback(...args);
        }
        finally {
            setIsLoading(false);
        }
    }, [callback]);

    return [call, isLoading];
}

export function useFetchData<T>(api: (signal: AbortSignal) => Promise<T>, keepStale = false, autoRefresh: number | null = null): [T | null, boolean, () => void, boolean] {
    const [refreshToken, setRefreshToken] = useState({ });
    const [loading, setIsLoading] = useState(true);
    const [data, setData] = useState<T | null>(null);
    const [notFound, setNotFound] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setIsLoading(true);
        if (!keepStale) {
            setData(null);
        }

        void api(abortRef.current.signal).then((data) => {
            setNotFound(false);
            setData(data);
            setIsLoading(false);
        }).catch((err: unknown) => {
            if (err instanceof RequestError && err.code === ErrorCode.NotFound) {
                setNotFound(true);
            }
        });

        return () => {
            if (!keepStale) {
                setData(null);
            }
            setIsLoading(true);
        };
    }, [api, refreshToken, keepStale]);

    useInterval(() => {
        setRefreshToken({});
    }, autoRefresh);

    return [
        data,
        loading,
        () => {
            setRefreshToken({});
        },
        notFound,
    ];
}

export function useEntityEditor<Type extends EntityConfig>(id: string | undefined, api: EntityApi<Type['Entity'], Type['EntityUpdate']>, context: (EntityContextData<Type>) | null):
{
    state: Type['State'] | undefined;
    fetch: () => Promise<Type['Entity']>;
    notFound: boolean;
    save: (update: Type['EntityUpdate']) => Promise<void>;
    isSaving: boolean;
} {
    const fetch = useCallback(() => {
        if (id) {
            return api.get(id);
        }
        else {
            return new Promise<Type['Entity']>(() => undefined);
        }
    }, [id, api]);

    const [state, setState] = useState<Type['State'] | undefined>(undefined);
    const [notFound, setNotFound] = useState(false);

    const [save, isSaving] = useAsync(useCallback(async (update: Type['EntityUpdate']) => {
        if (!id) {
            return;
        }

        const updated = await api.update(id, update);
        context?.actions.updated(updated.result);
    }, [id, api, context?.actions]));

    useEffect(() => {
        if (context?.state.list) {
            const newEntity = context.state.list.find(c => c.data.id === id) ?? null;
            setState(newEntity ?? undefined);
            setNotFound(!newEntity);
        }
    }, [id, context?.state.list]);

    return {
        state,
        fetch,
        notFound,
        save,
        isSaving,
    };
}

export function useDebounce(callback: () => void, timeout: number): [execute: () => void, cancel: () => void] {
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
    const callbackRef = useRef(callback);

    const cancel = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };

    const execute = () => {
        cancel();
        timerRef.current = setTimeout(() => {
            callbackRef.current();
        }, timeout);
    };

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        return () => {
            cancel();
        };
    }, []);

    return [
        execute,
        cancel,
    ];
}

export function useEntityDeletion<Type extends EntityConfig>(context: EntityContextData<Type> | null, onDeleted?: () => Promise<void> | void): { deleteEntity: (entity?: Type['State']) => void; dialog: ReactNode } {
    const [deletingEntity, setDeletingEntity] = useState<Type['State'] | undefined>(undefined);

    const [doDelete] = useAsync(useCallback(async () => {
        if (deletingEntity) {
            try {
                await context?.actions.delete(deletingEntity.data.id);
                await onDeleted?.();
            }
            finally {
                setDeletingEntity(undefined);
            }
        }
    }, [deletingEntity, context?.actions, onDeleted]));

    return {
        deleteEntity: setDeletingEntity,
        dialog: (
            <DeleteConfirmationDialog
                item={deletingEntity}
                itemTypeName={context?.name ?? 'entity'}
                onDelete={() => { void doDelete(); }}
                onCancel={() => { setDeletingEntity(undefined); }}
                itemInfoBuilder={state => state.info}
            />
        ),
    };
}
