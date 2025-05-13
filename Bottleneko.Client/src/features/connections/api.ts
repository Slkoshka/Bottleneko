import { request } from '../api/utils';
import { AnyConnection, AnyConnectionConfig, AnyConnectionDto, ExtractConfig, ExtractProtocol } from '.';

export interface ListConnectionsResponse {
    connections: AnyConnectionDto[];
}

export interface TestConnectionResponse {
    duration: string;
    extra: object | null;
}

export interface AddConnectionResponse {
    connection: AnyConnectionDto;
}

export interface UpdateConnectionResponse {
    connection: AnyConnectionDto;
}

export default {
    list: async (signal?: AbortSignal) => {
        return await request<ListConnectionsResponse>('GET', 'connections', { signal });
    },

    get: async (id: string, signal?: AbortSignal) => {
        return await request<AnyConnectionDto>('GET', `connections/${id}`, { signal });
    },

    test: async<Connection extends AnyConnection = never>(protocol: ExtractProtocol<Connection>, config: ExtractConfig<Connection>) => {
        return await request<TestConnectionResponse>('POST', `connections/test`, {
            body: {
                protocol,
                config,
            },
        });
    },

    add: async<Connection extends AnyConnection = never>(protocol: ExtractProtocol<Connection>, name: string, config: ExtractConfig<Connection>) => {
        return await request<AddConnectionResponse>('PUT', `connections`, {
            body: {
                protocol,
                name,
                config,
            },
        });
    },

    getAttachmentUrl: (connectionId: string, attachmentId: string) => {
        return `/api/connections/${connectionId}/attachments/${attachmentId}?download=1`;
    },

    start: async (id: string) => {
        await request<object>('POST', `connections/${id}/start`);
    },

    stop: async (id: string) => {
        await request<object>('POST', `connections/${id}/stop`);
    },

    restart: async (id: string) => {
        await request<object>('POST', `connections/${id}/restart`);
    },

    update: async (id: string, connection: { name?: string; autoStart?: boolean; config?: AnyConnectionConfig }) => {
        return await request<UpdateConnectionResponse>('PATCH', `connections/${id}`, {
            body: connection,
        });
    },

    delete: async (id: string) => {
        await request<object>('DELETE', `connections/${id}`);
    },
};
