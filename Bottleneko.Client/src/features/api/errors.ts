import { ErrorCode } from './responses';

export class APIError extends Error {
}

export class InvalidResponseError extends APIError {
    constructor(message = 'Invalid API response') {
        super(message);
    }
}

export class UnknownAPIError extends APIError {
    constructor(message = 'Unknown API error') {
        super(message);
    }
}

export class RequestError extends APIError {
    code: ErrorCode;
    extra: object | null;

    constructor(message: string, code: ErrorCode, extra: object | null) {
        super(message);
        this.code = code;
        this.extra = extra;
    }
}
