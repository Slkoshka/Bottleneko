import { v4 as uuidv4 } from 'uuid';
import { useEffect, useRef, useState } from 'react';
import deepEqual from 'deep-equal';
import { useEventListener } from '../events/context';
import { ChatMessageFilter, LogFilter, Packet } from '../api/dtos.gen';
import { useIfDeepChanged } from '../../app/hooks';
import { useWebSocketDispatch } from './context';

export interface LogSubscription {
    type: 'Logs';
    filter: LogFilter;
}

export interface ChatMessageSubscription {
    type: 'ChatMessages';
    filter: ChatMessageFilter;
}

type Subscription = LogSubscription | ChatMessageSubscription;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function useSubscription<EventType>({ subscription, maxEvents }: { subscription: Subscription; maxEvents?: number }) {
    const [events, setEvents] = useState<EventType[] | null>(null);

    useIfDeepChanged(subscription, () => {
        setEvents(null);
    });

    const ws = useWebSocketDispatch();
    const subscriptionRef = useRef<Subscription | null>(subscription);
    const subscriptionId = useRef(uuidv4());
    const eventsRef = useRef<EventType[]>([]);
    const initialReceiveRef = useRef<boolean>(true);

    useEffect(() => {
        if (!subscriptionRef.current) {
            return;
        }

        ws?.({
            action: `subscribeTo${subscriptionRef.current.type}`, payload: {
                id: subscriptionId.current,
                filter: subscriptionRef.current.filter,
            } as never,
        });

        return () => {
            ws?.({ action: 'unsubscribe', payload: { id: subscriptionId.current } });
            eventsRef.current = [];
            initialReceiveRef.current = true;
            setEvents(null);
        };
    }, [ws]);

    useEffect(() => {
        if (!deepEqual(subscriptionRef.current, subscription)) {
            subscriptionRef.current = subscription;
            ws?.({ action: 'unsubscribe', payload: { id: subscriptionId.current } });
            subscriptionId.current = uuidv4();
            eventsRef.current = [];
            initialReceiveRef.current = true;
            ws?.({
                action: `subscribeTo${subscription.type}`, payload: {
                    id: subscriptionId.current,
                    filter: subscription.filter,
                } as never,
            });
        }
    }, [ws, subscription]);

    useEventListener('websocket/connected', () => {
        ws?.({
            action: `subscribeTo${subscription.type}`, payload: {
                id: subscriptionId.current,
                filter: subscription.filter,
            } as never,
        });
    }, [ws, subscription]);

    useEventListener('websocket/packet', (packet: Packet) => {
        if (packet.$type !== 'Mail' || packet.subscriptionId !== subscriptionId.current) {
            return;
        }

        const newItems = packet.letters as EventType[];
        eventsRef.current = [...newItems, ...eventsRef.current];
        if (maxEvents && eventsRef.current.length > maxEvents) {
            eventsRef.current = eventsRef.current.slice(0, maxEvents);
        }
        if (!initialReceiveRef.current || newItems.length === 0) {
            setEvents(eventsRef.current);
            initialReceiveRef.current = false;
        }
    }, [ws, subscription]);

    return {
        events,
    };
}
