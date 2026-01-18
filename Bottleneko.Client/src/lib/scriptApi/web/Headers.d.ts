export default class Headers {
    private readonly _entries;
    constructor(init?: string | Headers | [string, string][]);
    append(name: string, value: string): void;
    set(name: string, value: string): void;
    delete(name: string): void;
    has(name: string): boolean;
    private _getSortedKeys;
    private _asObject;
    keys(): () => ArrayIterator<string>;
    get(name: string): string | null;
    entries(): Generator<[string, string]>;
    [Symbol.iterator](): Generator<[string, string]>;
    values(): Generator<string, void, unknown>;
    forEach(callback: (value: string, key: string, searchParams: Headers) => void, thisArg?: unknown): void;
    getSetCookie(): string[];
}
