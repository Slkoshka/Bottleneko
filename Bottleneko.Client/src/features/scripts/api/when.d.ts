type EventFilterCallback<T> = (msg: T) => boolean;
type EventFilter<T> = object | EventFilterCallback<T>;
type EventCallback<T> = ((msg: T) => Promise<unknown> | void);
declare const _default: {
    connection: {
        messageReceived: (callback: EventCallback<ChatMessage>, filter?: EventFilter<ChatMessage> | undefined) => void;
    };
};
export default _default;
