import { getAccessToken } from '../auth';
import { APIError, InvalidResponseError, RequestError, UnknownAPIError } from './errors';
import { ErrorResponse } from './responses';

export interface RequestProperties {
    body?: object;
    signal?: AbortSignal;
}

export async function request<T>(method: string, endpoint: string, properties?: RequestProperties): Promise<T> {
    const token = getAccessToken();

    let response;

    try {
        response = await fetch('/api/' + endpoint, {
            method,
            cache: 'no-store',
            body: properties?.body === undefined ? undefined : JSON.stringify(properties.body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? 'Bearer ' + token : '',
            },
            signal: properties?.signal,
        });
    }
    catch (exception) {
        if (exception instanceof APIError) {
            throw exception;
        }
        else if (exception instanceof Error) {
            throw new UnknownAPIError(exception.message);
        }
        else {
            throw new UnknownAPIError();
        }
    }

    if (response.status === 200) {
        if (response.headers.get('Content-Type')?.split(';')[0] !== 'application/json') {
            throw new InvalidResponseError(`Content-Type header doesn't match application/json (${response.headers.get('Content-Type') ?? 'null'})`);
        }

        return await response.json() as T;
    }
    else {
        if (response.headers.get('Content-Type')?.split(';')[0] !== 'application/json') {
            throw new RequestError(response.statusText, response.status, null);
        }

        const error = await response.json() as ErrorResponse;

        throw new RequestError(error.description, error.code, error.extra);
    }
}
