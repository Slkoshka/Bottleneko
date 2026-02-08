import { authState } from '../features/auth.svelte';
import type { ErrorResult } from './bottleneko.gen';
import { APIError, InvalidResponseError, RequestError, UnknownAPIError } from './errors';

export interface MutationRequestProperties {
    body?: object;
    accessToken?: string;
}

export interface RequestProperties extends MutationRequestProperties {
    signal?: AbortSignal;
}

export async function request<T>(method: string, endpoint: string, properties?: RequestProperties): Promise<T> {
    const accessToken =
        properties?.accessToken ?? (authState.data.status === 'logged-in' ? authState.data.accessToken : null);
    const response = await fetch('/api/' + endpoint, {
        method,
        cache: 'no-store',
        body: properties?.body === undefined ? undefined : JSON.stringify(properties.body),
        headers: {
            'Content-Type': 'application/json',
            Authorization: accessToken !== null ? `Bearer ${accessToken}` : '',
        },
        signal: properties?.signal,
    }).catch((exception: unknown) => {
        if (exception instanceof APIError) {
            throw exception;
        } else if (exception instanceof Error) {
            throw new UnknownAPIError(exception.message);
        } else {
            throw new UnknownAPIError();
        }
    });

    if (response.status === 200) {
        if (response.headers.get('Content-Type')?.split(';')[0] !== 'application/json') {
            throw new InvalidResponseError(
                `Content-Type header doesn't match application/json (${response.headers.get('Content-Type') ?? 'null'})`,
            );
        }

        return (await response.json()) as T;
    } else {
        if (response.headers.get('Content-Type')?.split(';')[0] !== 'application/json') {
            switch (response.status) {
                case 401:
                    throw new RequestError(response.statusText, 'Unauthorized', null);
                case 403:
                    throw new RequestError(response.statusText, 'Forbidden', null);
                case 404:
                    throw new RequestError(response.statusText, 'NotFound', null);
                case 500:
                    throw new RequestError(response.statusText, 'InternalError', null);

                default:
                    if (response.status >= 400 && response.status <= 499) {
                        throw new RequestError(response.statusText, 'InvalidOperation', null);
                    } else {
                        throw new RequestError(response.statusText, 'InternalError', null);
                    }
            }
        }

        const error = (await response.json()) as ErrorResult;

        throw new RequestError(error.message, error.code, error.extra);
    }
}
