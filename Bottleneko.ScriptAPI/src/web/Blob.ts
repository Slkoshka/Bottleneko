// https://developer.mozilla.org/en-US/docs/Web/API/Blob
export default class Blob {
    protected _nativeStream: JsMemoryStream;
    private readonly _type: string; get type() { return this._type; }
    get size() { return Number(this._nativeStream.Size); }

    constructor(blobBits: Iterable<ArrayBuffer | TypedArray | DataView | Blob | string>, options?: { type?: string  | null}) {
        if (blobBits[Symbol.iterator] === undefined) {
            throw new TypeError('blobBits must be an iterable object');
        }

        if (options !== undefined) {
            if (typeof options !== 'object') {
                throw new TypeError(`options must be an object`);
            }
            
            if (options.type !== null && options.type !== undefined && typeof options.type !== 'string') {
                throw new TypeError(`options.type must be a string`);
            }
        }

        this._nativeStream = new __Core.Bottleneko.Scripting.Js.JsMemoryStream();
        this._type = options?.type ?? '';

        for (const bit of blobBits) {
            try {
                if (bit instanceof Blob) {
                    this._nativeStream.Write(bit._nativeStream);
                }
                else {
                    this._nativeStream.Write(bit);
                }
            } catch (err: any) {
                throw new TypeError(err?.message ?? 'Failed to read data');
            }
        }
    }

    // @ts-ignore
    private static _blobFromStream(stream: JsMemoryStream, options?: { type?: string  | null}) {
        const blob = new Blob([], options);
        blob._nativeStream = stream;
        return blob;
    }

    arrayBuffer() {
        return new Promise<ArrayBuffer>((resolve) => {
            const buffer = new ArrayBuffer(this.size);
            this._nativeStream.ReadToArrayBuffer(buffer, 0n, 0n, BigInt(this.size));
            resolve(buffer);
        });
    }

    bytes(): Promise<Uint8Array> {
        return new Promise<Uint8Array>((resolve) => {
            const buffer = new ArrayBuffer(this.size);
            this._nativeStream.ReadToArrayBuffer(buffer, 0n, 0n, BigInt(this.size));
            resolve(new Uint8Array(buffer));
        });
    }

    slice(start?: number, end?: number, contentType?: string) {
        if (start === undefined) {
            start = 0;
        }
        if (end === undefined) {
            end = this.size;
        }
        if (end < 0) {
            end = this.size + end;
        }
        if (start < 0) {
            start = this.size + start;
        }

        if (start < 0 || start >= this.size || end < 0 || end >= this.size || end < start) {
            throw new TypeError('Invalid range');
        }

        if (start === end) {
            return new Blob([], { type: contentType == undefined ? this.type : contentType });
        }

        const buffer = new ArrayBuffer(end - start);
        this._nativeStream.ReadToArrayBuffer(buffer, BigInt(start), 0n, BigInt(end - start));
        return new Blob([buffer], { type: contentType == undefined ? this.type : contentType });
    }

    text() {
        return new Promise<string>((resolve) => {
           resolve(this._nativeStream.ReadAsText()) ;
        });
    }
};
