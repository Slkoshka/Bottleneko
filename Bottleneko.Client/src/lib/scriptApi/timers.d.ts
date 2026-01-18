export declare const wait: (milliseconds: number) => Promise<void>;
export declare const setInterval: (callback: (...args: unknown[]) => void, interval: number, ...args: unknown[]) => unknown;
export declare const setTimeout: (callback: (...args: unknown[]) => void, delay: number, ...args: unknown[]) => unknown;
export declare const clearInterval: (id: unknown) => boolean;
export declare const clearTimeout: (id: unknown) => boolean;
