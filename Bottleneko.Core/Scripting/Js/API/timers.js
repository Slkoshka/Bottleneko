export const wait = __Api.Wait;
let lastTimeout = 0;
const timers = new Set();
export const setInterval = (callback, interval, ...args) => {
    const id = ++lastTimeout;
    timers.add(id);
    const f = () => {
        if (timers.has(id)) {
            try {
                callback(...args);
            }
            finally {
                wait(interval).then(f);
            }
        }
    };
    wait(interval).then(f);
    return id;
};
export const setTimeout = (callback, delay, ...args) => {
    const id = ++lastTimeout;
    timers.add(id);
    const f = () => {
        if (timers.has(id)) {
            try {
                callback(...args);
            }
            finally {
                timers.delete(id);
            }
        }
    };
    wait(delay).then(f);
    return id;
};
export const clearInterval = (id) => timers.delete(id);
export const clearTimeout = (id) => timers.delete(id);
