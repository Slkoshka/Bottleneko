import EventEmitter from 'eventemitter3';
import { createContext, DependencyList, useContext, useEffect } from 'react';

export const EventEmitterContext = createContext<EventEmitter | null>(null);
export const useEventEmitter = () => useContext(EventEmitterContext);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useEventListener = (event: string, callback: (...args: any[]) => void, deps?: DependencyList) => {
    const eventEmitter = useEventEmitter();

    useEffect(() => {
        eventEmitter?.on(event, callback);
        return () => {
            eventEmitter?.off(event, callback);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventEmitter, callback, event, ...(deps ?? [])]);
};
