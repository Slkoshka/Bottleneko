import { asString } from '../_utils'

// https://developer.mozilla.org/en-US/docs/Web/API/Headers
export default class Headers {
    private readonly _entries: Map<string, string[]>;

    constructor(init?: string | Headers | [string, string][]) {
        this._entries = new Map();

        if (!init) {
            return;
        }

        if (init instanceof Headers) {
            for (const [name, value] of init) {
                this.append(name, value);
            }
        }
        else if (init !== null && typeof init[Symbol.iterator] === 'function') {
            for (const [name, value] of init) {
                this.append(asString(name), asString(value));
            }
        }
        else {
            const headers = __Api.HttpClient.ParseQueryString(asString(init))
            for (let i = 0; i < headers.Count; i++) {
                this.append(headers[i].Name, headers[i].Data as string);
            }
        }
    }

    append(name: string, value: string) {
        name = asString(name).toLowerCase();
        value = asString(value);
        const items = this._entries.get(name);
        if (items === undefined) {
            this._entries.set(name, [value]);
        } else {
            items.push(value);
        }
    }

    set(name: string, value: string) {
        name = asString(name).toLowerCase();
        value = asString(value);
        this._entries.set(name, [value]);
    }

    delete(name: string) {
        name = asString(name).toLowerCase();
        this._entries.delete(name);
    }

    has(name: string) {
        name = asString(name).toLowerCase();
        return this._entries.has(name);
    }

    private _getSortedKeys() {
        const keys = [...this._entries.keys()];
        keys.sort((a, b) => a.localeCompare(b, 'en'));
        return keys;
    }

    // @ts-ignore
    private _asObject() {
        const obj: Record<string, string[]> = {};
        for (const key of this._getSortedKeys()) {
            obj[key] = this._entries.get(key)!;
        }
        return obj;
    }

    keys() {
        return this._getSortedKeys()[Symbol.iterator];
    }

    get(name: string) {
        name = asString(name).toLowerCase();
        const items = this._entries.get(name);
        if (items === undefined) {
            return null;
        } else {
            return items.join(', ');
        }
    }

    entries(): Generator<[string, string]> {
        const self = this;
        return (function*() {
            for (const key of self._getSortedKeys()) {
                yield [key, self._entries.get(key)!.join(', ')];
            }
        })();
    }

    [Symbol.iterator](): Generator<[string, string]> {
        return this.entries();
    }

    values() {
        const self = this;
        return (function*() {
            for (const key of self._getSortedKeys()) {
                yield self._entries.get(key)!.join(', ');
            }
        })();
    }

    forEach(callback: (value: string, key: string, searchParams: Headers) => void, thisArg?: unknown) {
        callback = callback.bind(thisArg);
        for (const [key, value] of this.entries()) {
            callback(value, key, this);
        }
    }

    getSetCookie() {
        return this._entries.get('set-cookie') ?? [];
    }
};
