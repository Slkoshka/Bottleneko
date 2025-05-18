import Blob from './web/Blob';
import FormData from './web/FormData';
import Headers from './web/Headers';
import URLSearchParams from './web/URLSearchParams';
type RequestBody = string | ArrayBuffer | Blob | DataView | TypedArray | FormData | URLSearchParams;
interface RequestInit {
    body?: RequestBody | null;
    headers?: Headers | Record<string, string> | null;
    method?: string | null;
    redirect?: 'follow' | 'error' | 'manual' | null;
}
export declare class Request {
    private readonly _url;
    get url(): string;
    private readonly _body;
    get body(): RequestBody | null;
    private readonly _cache;
    get cache(): "no-store";
    private readonly _headers;
    get headers(): Headers;
    private readonly _method;
    get method(): string;
    private readonly _redirect;
    get redirect(): "follow" | "error" | "manual";
    constructor(resource: string | Request, options?: RequestInit);
}
declare class Response {
    private _response;
    private _headers;
    get headers(): Headers;
    get ok(): boolean;
    private _redirected;
    get redirected(): boolean;
    private _status;
    get status(): number;
    private _statusText;
    get statusText(): string;
    private _url;
    get url(): string;
    constructor(response: JsHttpResponse);
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    bytes(): Promise<Uint8Array<ArrayBuffer>>;
    formData(): Promise<void>;
    json(): Promise<unknown>;
    text(): Promise<string>;
}
export declare function fetch(resource: string | Request, options?: RequestInit): Promise<Response>;
export {};
