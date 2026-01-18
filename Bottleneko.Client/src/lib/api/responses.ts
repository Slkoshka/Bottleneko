export enum ErrorCode {
    UnknownError = 0,
    Unauthorized = 401,
    NotFound = 404,
    InternalError = 500,
    ConnectionError = 1000,
    DuplicateName = 1001,
    Timeout = 1002,
    InvalidOperation = 1003,
    SetupRequired = 1004,
}

export interface ErrorResponse {
    code: ErrorCode;
    description: string;
    extra: object | null;
}
