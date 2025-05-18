declare type SubscriptionToken = object;

declare interface JsApi {
    ScriptName: string;
    HttpClient: JsHttpClient;

    Subscribe(event: string, handler: (event: string, msg: unknown) => Promise<unknown> | undefined): SubscriptionToken;
    Unsubscribe(token: SubscriptionToken): void;
    Wait(milliseconds: number): Promise<void>;
    GetTypeName(type: unknown): string;
    IsEnum(value: unknown): boolean;
    GetConnection(id: bigint): Promise<Connection | null>;
    Stop(): void;
    Log(severity: EnumValue<LogSeverity>, category: string, message: string): void;
}

declare interface HostTypes {
    Bottleneko: {
        Logging: {
            LogSeverity: LogSeverity;
        };
        Api: {
            Dtos: {
                Protocol: Protocol;
                ConnectionStatus: ConnectionStatus;
            };
        };
        Scripting: {
            Bindings: {
                Discord: {
                    DiscordChannelType: DiscordChannelType;
                };
            };
            Js: {
                JsMemoryStream: { new(): JsMemoryStream };
                FormDataItem: { new(Name: string, Data: string | JsMemoryStream, Filename: string | null, ContentType: string | null): FormDataItem };
            };
        };
    };
}

declare type HostFunctions = object;

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
declare type TypedArray =
    Int8Array |
    Uint8Array |
    Uint8ClampedArray |
    Int16Array |
    Uint16Array |
    Int32Array |
    Uint32Array |
    Float32Array |
    Float64Array |
    BigInt64Array |
    BigUint64Array;

declare interface JsMemoryStream {
    Size: bigint;

    Write(value: string | ArrayBuffer | JsMemoryStream | DataView | TypedArray): void;
    ReadToArrayBuffer(buffer: ArrayBuffer, sourceStart: bigint, destStart: bigint, length: bigint): void;
    ReadAsText(): string;
}

declare interface FormDataItem
{
    Name: string;
    Data: string | JsMemoryStream;
    Filename: string;
    ContentType: string
}

declare interface HeaderItem {
    Name: string;
    Data: string;
}

declare interface HostArray<T> extends Record<number, T> {
    Count: number;
}

declare interface JsHttpResponse {
    StatusCode: number;
    StatusText: string;
    Headers: HostArray<HeaderItem>;
    Redirected: boolean;
    FinalUrl: string;

    ReadAsMemoryStreamAsync(): Promise<JsMemoryStream>;
    ReadAsStringAsync(): Promise<string>;
    ReadAsFormDataAsync(): Promise<HostArray<FormDataItem>>;
}

declare interface JsHttpClient {
    ParseQueryString(str: string): HostArray<FormDataItem>;
    SerializeFormData(items: FormDataItem[]): JsMemoryStream;
    MakeRequestAsync(method: string, url: string, body: JsMemoryStream | null, bodyContentType: string | null, headers: Record<string, string[]>, followRedirects: boolean): Promise<JsHttpResponse>;
}

declare const __Api: JsApi;
declare const __Host: HostFunctions;
declare const __Core: HostTypes;
