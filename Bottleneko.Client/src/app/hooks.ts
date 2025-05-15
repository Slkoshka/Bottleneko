import { EffectCallback, useCallback, useEffect, useRef, useState } from 'react';
import { RequestError } from '../features/api/errors';
import { ErrorCode } from '../features/api/responses';

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
