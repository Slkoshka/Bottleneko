import Blob from './Blob';
// https://developer.mozilla.org/en-US/docs/Web/API/File
export default class File extends Blob {
    _name;
    get name() { return this._name; }
    constructor(fileBits, fileName, options) {
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
    static _fileFromStream(stream, fileName, options) {
        const file = new File([], fileName, options);
        file._nativeStream = stream;
        return file;
    }
}
;
