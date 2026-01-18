export default class Blob {
    protected _nativeStream: JsMemoryStream;
    private readonly _type;
    get type(): string;
    get size(): number;
    constructor(blobBits: Iterable<ArrayBuffer | TypedArray | DataView | Blob | string>, options?: {
        type?: string | null;
    });
    private static _blobFromStream;
    arrayBuffer(): Promise<ArrayBuffer>;
    bytes(): Promise<Uint8Array>;
    slice(start?: number, end?: number, contentType?: string): Blob;
    text(): Promise<string>;
}
