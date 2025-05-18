import Blob from './Blob'

// https://developer.mozilla.org/en-US/docs/Web/API/File
export default class File extends Blob {
    private readonly _name: string; get name() { return this._name; }

    constructor(fileBits: Iterable<ArrayBuffer | TypedArray | DataView | Blob | string>, fileName: string, options?: { type?: string | null }) {
        if (fileBits[Symbol.iterator] === undefined) {
            throw new TypeError('fileBits must be an iterable object');
        }

        if (typeof fileName !== 'string') {
            throw new TypeError(`fileName must be a string`);
        }

        super(fileBits, options);

        this._name = fileName;
    }

    // @ts-ignore
    private static _fileFromStream(stream: JsMemoryStream, fileName: string, options?: { type?: string  | null}) {
        const file = new File([], fileName, options);
        file._nativeStream = stream;
        return file;
    }
};
