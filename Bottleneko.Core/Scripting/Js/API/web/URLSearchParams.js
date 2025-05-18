import { asString } from '../_utils';
// https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
export default class URLSearchParams {
    _entries;
    constructor() {
        this._entries = [];
    }
    [Symbol.iterator]() {
        return this.entries();
    }
    entries() {
        return this._entries.values();
    }
    append(name, value) {
        name = asString(name);
        value = asString(value);
        this._entries.push([name, value]);
    }
    set(name, value) {
        this.delete(name);
        this.append(name, value);
    }
    get(name) {
        name = asString(name);
        for (const item of this._entries) {
            if (item[0] === name) {
                return item[1];
            }
        }
        return null;
    }
    getAll(name) {
        name = asString(name);
        return this._entries.filter(entry => entry[0] === name).map(item => item[1]);
    }
    has(name) {
        return this.get(name) !== null;
    }
    keys() {
        const self = this;
        return (function* () {
            for (const item of self._entries) {
                yield item[0];
            }
        })();
    }
    delete(name, value) {
        name = asString(name);
        value = value === undefined ? undefined : asString(value);
        this._entries = this._entries.filter(item => item[0] === name && (value === undefined || item[1] === value));
    }
    sort() {
        this._entries.sort((a, b) => a[0].localeCompare(b[0], 'en'));
    }
    values() {
        const self = this;
        return (function* () {
            for (const item of self._entries) {
                yield item[1];
            }
        })();
    }
    _encode(value) {
        const stream = new __Core.Bottleneko.Scripting.Js.JsMemoryStream();
        stream.Write(value);
        const buffer = new ArrayBuffer(Number(stream.Size));
        stream.ReadToArrayBuffer(buffer, 0n, 0n, stream.Size);
        const result = [];
        const bytes = new Uint8Array(buffer);
        for (const byte of bytes) {
            if ((byte >= 'A'.charCodeAt(0) && byte <= 'Z'.charCodeAt(0)) ||
                (byte >= 'a'.charCodeAt(0) && byte <= 'z'.charCodeAt(0)) ||
                byte === '*'.charCodeAt(0) ||
                byte === '-'.charCodeAt(0) ||
                byte === '.'.charCodeAt(0) ||
                byte === '_'.charCodeAt(0)) {
                result.push(String.fromCharCode(byte));
            }
            else if (byte === ' '.charCodeAt(0)) {
                result.push('+');
            }
            else {
                if (byte < 16) {
                    result.push('%0');
                }
                else {
                    result.push('%');
                }
                result.push(byte.toString(16).toUpperCase());
            }
        }
        return result.join();
    }
    toString() {
        return this._entries.map(([key, value]) => `${this._encode(key)}=${this._encode(value)}`).join('&');
    }
    forEach(callback, thisArg) {
        if (thisArg !== undefined) {
            callback = callback.bind(thisArg);
        }
        this._entries.forEach(([key, value]) => callback(value, key, this), this);
    }
}
;
