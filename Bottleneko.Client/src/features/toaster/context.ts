import { createContext, Dispatch, ReactNode, useContext } from 'react';
import { Variant } from 'react-bootstrap/esm/types';

export type ToastID = string;
export type ToastVariant = Variant;

export interface Toast {
    id: ToastID;
    variant: ToastVariant;
    title: ReactNode;
    text: ReactNode;
}

export interface ToasterState {
    toasts: Toast[];
}

export type ToasterAction = { action: 'show'; toast: Omit<Toast, 'id'> } | { action: 'hide'; id: ToastID };

export const ToasterContext = createContext<ToasterState | null>(null);
export const ToasterDispatchContext = createContext<Dispatch<ToasterAction> | null>(null);

export const useToaster = () => useContext(ToasterContext);
export const useToasterDispatch = () => useContext(ToasterDispatchContext);
