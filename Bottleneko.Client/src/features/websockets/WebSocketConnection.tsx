import { ReactNode, useCallback, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { getAccessToken } from '../auth';
import { useEventEmitter } from '../events/context';
import { AuthenticatePacket, Packet, SubscribePacket, UnsubscribePacket } from '../api/dtos.gen';
import { WebSocketAction, WebSocketDispatchContext } from './context';

export default function WebSocketConnection({ children }: { children?: ReactNode | undefined }) {
    const eventEmitter = useEventEmitter();
    const onMessage = useCallback((message: MessageEvent) => {
        if (typeof message.data === 'string') {
            eventEmitter?.emit('websocket/packet', JSON.parse(message.data));
        }
    }, [eventEmitter]);
    const { sendJsonMessage, readyState, getWebSocket } = useWebSocket('/ws', {
        shouldReconnect: e => e.code !== 1008,
        onMessage,
        filter: () => false,
    });

    const prevStateRef = useRef<ReadyState>();
    const isReadyRef = useRef(false);

    const dispatch = useCallback((action: WebSocketAction) => {
        switch (action.action) {
            case 'send':
                if (isReadyRef.current) {
                    sendJsonMessage<Packet>(action.payload);
                }
                break;

            case 'subscribeToLogs':
                if (isReadyRef.current) {
                    sendJsonMessage<Packet>({
                        $type: 'Subscribe',
                        id: action.payload.id,
                        topic: {
                            $type: 'Logs',
                            filter: action.payload.filter,
                        },
                        beforeId: null,
                    });
                }
                break;

            case 'subscribeToChatMessages':
                if (isReadyRef.current) {
                    sendJsonMessage<SubscribePacket>({
                        $type: 'Subscribe',
                        id: action.payload.id,
                        topic: {
                            $type: 'ChatMessages',
                            filter: action.payload.filter,
                        },
                        beforeId: null,
                    });
                }
                break;

            case 'unsubscribe':
                if (isReadyRef.current) {
                    sendJsonMessage<UnsubscribePacket>({
                        $type: 'Unsubscribe',
                        id: action.payload.id,
                    });
                }
                break;

            case 'disconnect':
                getWebSocket()?.close();
                break;
        }
    }, [getWebSocket, sendJsonMessage]);

    useEffect(() => {
        if (readyState === prevStateRef.current) {
            return;
        }

        switch (readyState) {
            case ReadyState.OPEN: {
                const accessToken = getAccessToken();
                if (accessToken) {
                    sendJsonMessage<AuthenticatePacket>({ $type: 'Authenticate', accessToken });
                    isReadyRef.current = true;
                    eventEmitter?.emit('websocket/connected');
                }
                break;
            }
            case ReadyState.CLOSED: {
                isReadyRef.current = false;
                eventEmitter?.emit('websocket/disconnected');
                break;
            }
        }

        prevStateRef.current = readyState;
    }, [readyState, sendJsonMessage, eventEmitter]);

    return (
        <WebSocketDispatchContext.Provider value={dispatch}>
            {children}
        </WebSocketDispatchContext.Provider>
    );
}
