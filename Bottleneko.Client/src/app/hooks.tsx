import { EffectCallback, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import deepEqual from 'deep-equal';
import { RequestError } from '../features/api/errors';
import { ErrorCode } from '../features/api/responses';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { EntityApi, EntityConfig, EntityContextData } from './EntityProvider';

export function useOnceEffect(effect: EffectCallback) {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            effect();
        }
    });
}

export function useOnce(callback: () => void) {
    const [isInitialized, setIsInitialized] = useState(false);

    if (!isInitialized) {
        setIsInitialized(true);
        callback();
    }
}

export function useIfDeepChanged<T>(value: T, callback: (value: T) => void, alwaysInit = false) {
    const [oldValue, setOldValue] = useState<T>(value);
    const [isInitialized, setIsInitialized] = useState(false);
    if (!deepEqual(oldValue, value) || (alwaysInit && !isInitialized)) {
        setOldValue(value);
        setIsInitialized(true);
        callback(value);
    }
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

export function useFetchData<T>(api: (signal: AbortSignal) => Promise<T>, keepStale = false, autoRefresh: number | null = null, onNewData: ((data: T | null) => void) | null = null):
{
    data: T | null;
    isLoading: boolean;
    refresh: () => void;
    notFound: boolean;
    timestamp: number | null;
} {
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTimestamp, setRefreshTimestamp] = useState<number | null>(null);
    const [data, setData] = useState<T | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [initialAbortController] = useState(new AbortController());
    const abortRef = useRef<AbortController>(initialAbortController);

    const changeData = useCallback((data: T | null) => {
        setRefreshTimestamp(Date.now());
        onNewData?.(data);
        setData(data);
    }, [onNewData]);

    const cleanup = useCallback(() => {
        abortRef.current.abort();
        if (!keepStale) {
            changeData(null);
        }
        setIsLoading(true);
    }, [keepStale, changeData]);

    const fetch = useCallback((signal: AbortSignal) => {
        void api(signal).then((data) => {
            setNotFound(false);
            changeData(data);
            setIsLoading(false);
        }).catch((err: unknown) => {
            if (err instanceof RequestError && err.code === ErrorCode.NotFound) {
                setNotFound(true);
            }
        });
    }, [api, changeData]);

    const refresh = useCallback(() => {
        abortRef.current.abort();
        abortRef.current = new AbortController();
        setIsLoading(true);
        if (!keepStale) {
            changeData(null);
        }

        fetch(abortRef.current.signal);
    }, [keepStale, fetch, changeData]);

    useEffect(() => {
        fetch(initialAbortController.signal);
        return cleanup;
    }, [cleanup, fetch, initialAbortController.signal]);

    useInterval(refresh, autoRefresh);

    return {
        data,
        isLoading,
        refresh,
        notFound,
        timestamp: refreshTimestamp,
    };
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

    const entity = context?.state.list?.find(c => c.data.id === id) ?? undefined;

    const [save, isSaving] = useAsync(useCallback(async (update: Type['EntityUpdate']) => {
        if (!id) {
            return;
        }

        const updated = await api.update(id, update);
        context?.actions.updated(updated.result);
    }, [id, api, context?.actions]));

    return {
        state: entity,
        fetch,
        notFound: !entity,
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

export function useEntityDeletion<Type extends EntityConfig>(context: EntityContextData<Type> | null, onDeleted?: () => Promise<void> | void):
{
    deleteEntity: (entity?: Type['State']) => void;
    dialog: ReactNode;
} {
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
