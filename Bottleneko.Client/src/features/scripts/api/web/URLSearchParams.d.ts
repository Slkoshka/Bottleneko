export default class URLSearchParams {
    private _entries;
    constructor();
    [Symbol.iterator](): ArrayIterator<[name: string, value: string]>;
    entries(): ArrayIterator<[name: string, value: string]>;
    append(name: string, value: string): void;
    set(name: string, value: string): void;
    get(name: string): string | null;
    getAll(name: string): string[];
    has(name: string): boolean;
    keys(): Generator<string, void, unknown>;
    delete(name: string, value?: string): void;
    sort(): void;
    values(): Generator<string, void, unknown>;
    private _encode;
    toString(): string;
    forEach(callback: (value: string, key: string, searchParams: URLSearchParams) => void, thisArg?: unknown): void;
}
