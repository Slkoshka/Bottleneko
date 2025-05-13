import { createContext, Dispatch, useContext } from 'react';
import { ChatMessageFilter, LogFilter, Packet } from '../api/dtos.gen';

export interface WSLogSubscription {
    id: string;
    filter: LogFilter;
}

export interface WSChatMessageSubscription {
    id: string;
    filter: ChatMessageFilter;
}

export type WebSocketAction =
    { action: 'send'; payload: Packet } |
    { action: 'subscribeToLogs'; payload: WSLogSubscription } |
    { action: 'subscribeToChatMessages'; payload: WSChatMessageSubscription } |
    { action: 'unsubscribe'; payload: { id: string } } |
    { action: 'disconnect' };

export const WebSocketDispatchContext = createContext<Dispatch<WebSocketAction> | null>(null);

export const useWebSocketDispatch = () => useContext(WebSocketDispatchContext);
