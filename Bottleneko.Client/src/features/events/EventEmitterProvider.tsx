import { ReactNode, useState } from 'react';
import EventEmitter from 'eventemitter3';
import { EventEmitterContext } from './context';

export default function EventEmitterProvider({ children }: { children?: ReactNode | undefined }) {
    const [eventEmitter] = useState(new EventEmitter());

    return <EventEmitterContext.Provider value={eventEmitter}>{children}</EventEmitterContext.Provider>;
}
