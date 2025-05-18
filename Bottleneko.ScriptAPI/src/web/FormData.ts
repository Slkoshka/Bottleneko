import { asString } from '../_utils'
import Blob from './Blob'
import File from './File'

// https://developer.mozilla.org/en-US/docs/Web/API/FormData
export default class FormData {
    private _entries: [name: string, value: Blob | string, filename?: string][];

    constructor() {
        this._entries = [];
    }

    append(name: string, value: Blob | string, filename?: string) {
        name = asString(name);

        if (typeof value !== 'string' && !(value instanceof Blob)) {
            asString(value);
        }

        if (value instanceof Blob) {
            if (filename === undefined) {
                filename = value instanceof File ? value.name : 'blob';
            }

            if (typeof filename !== 'string') {
                filename = asString(filename);
            }
        }
        else if (filename !== undefined)
        {
            throw new TypeError('Filename can only be specified for Blob objects');
        }

        this._entries.push([name, value, filename]);
    }

    // @ts-ignore
    private _toNativeStream(): JsMemoryStream {
        return __Api.HttpClient.SerializeFormData(this._entries.map(([name, value, filename]) =>
            new __Core.Bottleneko.Scripting.Js.FormDataItem(
                name,
                value instanceof Blob ? (value as any)._nativeStream as JsMemoryStream : value,
                filename ?? null,
                value instanceof File ? value.name : 'application/octet-stream')));
    }

    set(name: string, value: Blob | string, filename?: string) {
        this.delete(name);
        this.append(name, value, filename);
    }

    delete(name: string) {
        name = asString(name);
        this._entries = this._entries.filter(item => item[0] === name);
    }

    has(name: string) {
        return this.get(name) !== null;
    }

    keys() {
        const self = this;
        return (function*() {
            for (const item of self._entries) {
                yield item[0];
            }
        })();
    }

    get(name: string) {
        name = asString(name);
        for (const item of this._entries) {
            if (item[0] === name) {
                return item[1];
            }
        }
        return null;
    }

    getAll(name: string) {
        name = asString(name);
        return this._entries.filter(entry => entry[0] === name).map(item => item[1]);
    }

    entries(): Generator<[string, string | Blob]> {
        const self = this;
        return (function*() {
            for (const item of self._entries) {
                yield [item[0], item[1]];
            }
        })();
    }

    [Symbol.iterator](): Generator<[string, string | Blob]> {
        return this.entries();
    }

    values(): Generator<string | Blob> {
        const self = this;
        return (function*() {
            for (const item of self._entries) {
                yield item[1];
            }
        })();
    }
};
