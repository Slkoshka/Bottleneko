import Blob from './Blob';
export default class File extends Blob {
    private readonly _name;
    get name(): string;
    constructor(fileBits: Iterable<ArrayBuffer | TypedArray | DataView | Blob | string>, fileName: string, options?: {
        type?: string | null;
    });
    private static _fileFromStream;
}
