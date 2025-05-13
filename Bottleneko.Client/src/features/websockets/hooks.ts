import { v4 as uuidv4 } from 'uuid';
import { useEffect, useRef, useState } from 'react';
import deepEqual from 'deep-equal';
import { useEventListener } from '../events/context';
import { ChatMessageFilter, LogFilter, MailPacket, Packet } from '../api/dtos.gen';
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
    const ws = useWebSocketDispatch();
    const wsRef = useRef(ws);
    const subscriptionId = useRef(uuidv4());
    const subscriptionRef = useRef<Subscription | null>(subscription);
    const [events, setEvents] = useState<EventType[] | null>(null);
    const eventsRef = useRef<EventType[]>([]);
    const initialReceiveRef = useRef<boolean>(true);

    useEffect(() => {
        wsRef.current = ws;
    }, [ws]);

    useEffect(() => {
        if (!subscriptionRef.current) {
            return;
        }

        wsRef.current?.({
            action: `subscribeTo${subscriptionRef.current.type}`, payload: {
                id: subscriptionId.current,
                filter: subscriptionRef.current.filter,
            } as never,
        });

        return () => {
            wsRef.current?.({ action: 'unsubscribe', payload: { id: subscriptionId.current } });
            eventsRef.current = [];
            initialReceiveRef.current = true;
            setEvents(null);
        };
    }, []);

    useEffect(() => {
        if (!deepEqual(subscriptionRef.current, subscription)) {
            subscriptionRef.current = subscription;
            ws?.({ action: 'unsubscribe', payload: { id: subscriptionId.current } });
            subscriptionId.current = uuidv4();
            eventsRef.current = [];
            initialReceiveRef.current = true;
            setEvents(null);
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
    }, [subscriptionId, subscription]);

    useEventListener('websocket/packet', (packet: Packet) => {
        if (packet.$type !== 'Mail' || (packet as MailPacket).subscriptionId !== subscriptionId.current) {
            return;
        }

        const newItems = (packet as MailPacket).letters as EventType[];
        eventsRef.current = [...newItems, ...eventsRef.current];
        if (maxEvents && eventsRef.current.length > maxEvents) {
            eventsRef.current = eventsRef.current.slice(0, maxEvents);
        }
        if (!initialReceiveRef.current || newItems.length === 0) {
            setEvents(eventsRef.current);
            initialReceiveRef.current = false;
        }
    }, [subscription]);

    return {
        events,
    };
}
