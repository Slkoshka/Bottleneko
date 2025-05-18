import Blob from './web/Blob';
import File from './web/File';
import FormData from './web/FormData';
import Headers from './web/Headers';
import URLSearchParams from './web/URLSearchParams';

type RequestBody =
    string |
    ArrayBuffer |
    Blob |
    DataView |
    TypedArray |
    FormData |
    URLSearchParams;

// https://developer.mozilla.org/en-US/docs/Web/API/RequestInit
interface RequestInit {
    body?: RequestBody | null;
    headers?: Headers | Record<string, string> | null;
    method?: string | null;
    redirect?: 'follow' | 'error' | 'manual' | null;
}

// https://developer.mozilla.org/en-US/docs/Web/API/Request
export class Request {
    private readonly _url: string; get url() { return this._url; }
    private readonly _body: RequestBody | null; get body() { return this._body; }
    private readonly _cache: 'no-store'; get cache() { return this._cache; }
    private readonly _headers: Headers; get headers() { return this._headers; }
    private readonly _method: string; get method() { return this._method; }
    private readonly _redirect: 'follow' | 'error' | 'manual'; get redirect() { return this._redirect; }

    constructor(resource: string | Request, options?: RequestInit) {
        let headers = options?.headers ?? undefined;
        if (headers !== undefined && !(headers instanceof Headers)) {
            const newHeaders = new Headers();
            for (const [key, value] of Object.entries(headers)) {
                newHeaders.append(key, value);
            }
            headers = newHeaders;
        }

        this._url = resource instanceof Request ? resource.url : resource;
        this._body = options?.body ?? (resource instanceof Request ? resource.body : undefined) ?? null;
        this._cache = 'no-store';
        this._headers = headers ?? (resource instanceof Request ? resource.headers : undefined) ?? new Headers();
        this._method = options?.method ?? (resource instanceof Request ? resource.method : undefined) ?? 'GET';
        this._redirect = options?.redirect ?? (resource instanceof Request ? resource.redirect : undefined) ?? 'follow';

        if ((this.method.toLowerCase() === 'get' || this.method.toLowerCase() === 'head') && this.body !== null) {
            throw new TypeError('Request with GET/HEAD method cannot have body');
        }
    }
};

// https://developer.mozilla.org/en-US/docs/Web/API/Response
class Response {
    private _response: JsHttpResponse;
    private _headers: Headers; get headers() { return this._headers; }
    get ok() { return this._status >= 200 && this._status <= 299; }
    private _redirected: boolean; get redirected() { return this._redirected; }
    private _status: number; get status() { return this._status; }
    private _statusText: string; get statusText() { return this._statusText; }
    private _url: string; get url() { return this._url; }

    constructor(response: JsHttpResponse) {
        this._response = response;
        this._headers = new Headers();
        this._redirected = response.Redirected;
        this._status = response.StatusCode;
        this._statusText = response.StatusText;
        this._url = response.FinalUrl;

        for (let i = 0; i < response.Headers.Count; i++) {
            const header = response.Headers[i];
            this._headers.append(header.Name, header.Data);
        }
    }

    async arrayBuffer() {
        const stream = await this._response.ReadAsMemoryStreamAsync();
        const buffer = new ArrayBuffer(Number(stream.Size));
        stream.ReadToArrayBuffer(buffer, 0n, 0n, stream.Size);
        return buffer;
    }

    async blob() {
        return (Blob as any)._blobFromStream(await this._response.ReadAsMemoryStreamAsync(), { type: this.headers.get('content-type') }) as Blob;
    }

    async bytes() {
        return new Uint8Array(await this.arrayBuffer());
    }

    async formData() {
        const formData = new FormData();
        const items = await this._response.ReadAsFormDataAsync();
        for (let i = 0; i < items.Count; i++) {
            const item = items[i];
            if (typeof item.Data === 'string') {
                formData.append(item.Name, item.Data);
            }
            else {
                formData.append(item.Name, (File as any)._fileFromStream(item.Data, item.Filename, { type: item.ContentType }) as File, item.Filename);
            }
        }
    }

    async json(): Promise<unknown> {
        return JSON.parse(await this.text());
    }

    async text() {
        return await this._response.ReadAsStringAsync();
    }
}

export async function fetch(resource: string | Request, options?: RequestInit): Promise<Response> {
    const request = (resource instanceof Request && options === undefined) ? resource : new Request(resource, options);

    const body: typeof request.body = request.body;
    let bodyStream: JsMemoryStream | null = null;
    let guessedContentType: string | null = null;

    if (body !== null) {
        if (body instanceof FormData) {
            guessedContentType = 'multipart/form-data';
            bodyStream = (body as any)._toNativeStream() as JsMemoryStream;
        }
        else if (body instanceof URLSearchParams) {
            guessedContentType = 'application/x-www-form-urlencoded';
            bodyStream = new __Core.Bottleneko.Scripting.Js.JsMemoryStream();
            bodyStream.Write(body.toString());
        }
        else if (typeof body === 'string') {
            guessedContentType = 'text/plain';
            bodyStream = new __Core.Bottleneko.Scripting.Js.JsMemoryStream();
            bodyStream.Write(body);
        }
        else if (!(body instanceof Blob)) {
            guessedContentType = 'application/octet-stream';
            bodyStream = new __Core.Bottleneko.Scripting.Js.JsMemoryStream();
            bodyStream.Write(body);
        }
        else {
            guessedContentType = body.type;
            bodyStream = (body as any)._nativeStream as JsMemoryStream;
        }
    }

    const response = await __Api.HttpClient.MakeRequestAsync(
        request.method,
        request.url,
        bodyStream,
        request.headers.get('content-type') ?? guessedContentType,
        (request.headers as any)._asObject() as Record<string, string[]>,
        request.redirect === 'follow'
    );

    if (request.redirect === 'error' && response.StatusCode >= 300 && response.StatusCode <= 399) {
        throw new TypeError('Unexpected redirect');
    }

    return new Response(response);
};
