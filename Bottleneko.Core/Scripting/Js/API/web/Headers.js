import { asString } from '../_utils';
// https://developer.mozilla.org/en-US/docs/Web/API/Headers
export default class Headers {
    _entries;
    constructor(init) {
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
            const headers = __Api.HttpClient.ParseQueryString(asString(init));
            for (let i = 0; i < headers.Count; i++) {
                this.append(headers[i].Name, headers[i].Data);
            }
        }
    }
    append(name, value) {
        name = asString(name).toLowerCase();
        value = asString(value);
        const items = this._entries.get(name);
        if (items === undefined) {
            this._entries.set(name, [value]);
        }
        else {
            items.push(value);
        }
    }
    set(name, value) {
        name = asString(name).toLowerCase();
        value = asString(value);
        this._entries.set(name, [value]);
    }
    delete(name) {
        name = asString(name).toLowerCase();
        this._entries.delete(name);
    }
    has(name) {
        name = asString(name).toLowerCase();
        return this._entries.has(name);
    }
    _getSortedKeys() {
        const keys = [...this._entries.keys()];
        keys.sort((a, b) => a.localeCompare(b, 'en'));
        return keys;
    }
    // @ts-ignore
    _asObject() {
        const obj = {};
        for (const key of this._getSortedKeys()) {
            obj[key] = this._entries.get(key);
        }
        return obj;
    }
    keys() {
        return this._getSortedKeys()[Symbol.iterator];
    }
    get(name) {
        name = asString(name).toLowerCase();
        const items = this._entries.get(name);
        if (items === undefined) {
            return null;
        }
        else {
            return items.join(', ');
        }
    }
    entries() {
        const self = this;
        return (function* () {
            for (const key of self._getSortedKeys()) {
                yield [key, self._entries.get(key).join(', ')];
            }
        })();
    }
    [Symbol.iterator]() {
        return this.entries();
    }
    values() {
        const self = this;
        return (function* () {
            for (const key of self._getSortedKeys()) {
                yield self._entries.get(key).join(', ');
            }
        })();
    }
    forEach(callback, thisArg) {
        callback = callback.bind(thisArg);
        for (const [key, value] of this.entries()) {
            callback(value, key, this);
        }
    }
    getSetCookie() {
        return this._entries.get('set-cookie') ?? [];
    }
}
;
