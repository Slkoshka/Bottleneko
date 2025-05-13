import { RequestError } from '../features/api/errors';
import { ErrorCode } from '../features/api/responses';

export function formatDuration(time: number) {
    const days = Math.floor(time / 86400);
    const hours = Math.floor((time % 86400) / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    const withoutDays = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (days >= 1) {
        return `${days.toString()} day${days === 1 ? '' : 's'}, ${withoutDays}`;
    }
    else {
        return withoutDays;
    }
}

export interface ErrorMetadata {
    code: ErrorCode;
    message: string;
    extra: object | null;
}

export function extractErrorInfo(err: unknown): ErrorMetadata {
    if (err instanceof RequestError) {
        return { code: err.code, message: err.message, extra: err.extra };
    }
    else {
        return { code: ErrorCode.UnknownError, message: err instanceof Error ? err.message : 'Unknown error', extra: null };
    }
}
