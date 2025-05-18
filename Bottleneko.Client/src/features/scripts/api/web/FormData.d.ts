import Blob from './Blob';
export default class FormData {
    private _entries;
    constructor();
    append(name: string, value: Blob | string, filename?: string): void;
    private _toNativeStream;
    set(name: string, value: Blob | string, filename?: string): void;
    delete(name: string): void;
    has(name: string): boolean;
    keys(): Generator<string, void, unknown>;
    get(name: string): string | Blob | null;
    getAll(name: string): (string | Blob)[];
    entries(): Generator<[string, string | Blob]>;
    [Symbol.iterator](): Generator<[string, string | Blob]>;
    values(): Generator<string | Blob>;
}
