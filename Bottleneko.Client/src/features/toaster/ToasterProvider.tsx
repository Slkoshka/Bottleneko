import { v4 as uuidv4 } from 'uuid';
import { ReactNode, Reducer, useReducer } from 'react';
import { ToasterAction, ToasterContext, ToasterDispatchContext, ToasterState } from './context';

export default function ToasterProvider({ children }: { children?: ReactNode | undefined }) {
    const [toasts, dispatch] = useReducer<Reducer<ToasterState, ToasterAction>>((state, action) => {
        switch (action.action) {
            case 'show':
                return {
                    ...state,
                    toasts: [
                        ...state.toasts,
                        {
                            id: uuidv4(),
                            ...action.toast,
                        },
                    ],
                };

            case 'hide':
                return {
                    ...state,
                    toasts: state.toasts.filter(t => t.id !== action.id),
                };

            default:
                return state;
        }
    }, {
        toasts: [],
    });

    return (
        <ToasterContext.Provider value={toasts}>
            <ToasterDispatchContext.Provider value={dispatch}>
                {children}
            </ToasterDispatchContext.Provider>
        </ToasterContext.Provider>
    );
}
