export const wait = __Api.Wait as (milliseconds: number) => Promise<void>;

let lastTimeout = 0;
const timers = new Set();

export const setInterval = (callback: (...args: unknown[]) => void, interval: number, ...args: unknown[]): unknown => {
    const id = ++lastTimeout;
    timers.add(id);

    const f = () => {
        if (timers.has(id)) {
            try {
                callback(...args);
            } finally {
                wait(interval).then(f);
            }
        }
    };

    wait(interval).then(f);

    return id;
};

export const setTimeout = (callback: (...args: unknown[]) => void, delay: number, ...args: unknown[]): unknown => {
    const id = ++lastTimeout;
    timers.add(id);

    const f = () => {
        if (timers.has(id)) {
            try {
                callback(...args);
            } finally {
                timers.delete(id);
            }
        }
    };

    wait(delay).then(f);

    return id;
};

export const clearInterval = (id: unknown) => timers.delete(id);
export const clearTimeout = (id: unknown) => timers.delete(id);
