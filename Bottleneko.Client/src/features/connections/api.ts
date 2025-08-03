import { ConnectionDto, ProtocolConfiguration } from '../api/dtos.gen';
import { request } from '../api/utils';

export interface ListConnectionsResponse {
    result: ConnectionDto[];
}

export interface TestConnectionResponse {
    duration: string;
    extra: object | null;
}

export interface AddConnectionResponse {
    result: ConnectionDto;
}

export interface UpdateConnectionResponse {
    result: ConnectionDto;
}

export default {
    list: async (signal?: AbortSignal) => {
        return await request<ListConnectionsResponse>('GET', 'connections', { signal });
    },

    get: async (id: string, signal?: AbortSignal) => {
        return await request<ConnectionDto>('GET', `connections/${id}`, { signal });
    },

    test: async (config: ProtocolConfiguration) => {
        return await request<TestConnectionResponse>('POST', `connections/test`, {
            body: {
                protocol: config.$type,
                config,
            },
        });
    },

    add: async (parameters: { name: string; config: ProtocolConfiguration }) => {
        return await request<AddConnectionResponse>('PUT', `connections`, {
            body: {
                protocol: parameters.config.$type,
                name: parameters.name,
                config: parameters.config,
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

    update: async (id: string, connection: Partial<Omit<ConnectionDto, 'id' | 'protocol' | 'extendedStatus'>>) => {
        return await request<UpdateConnectionResponse>('PATCH', `connections/${id}`, {
            body: connection,
        });
    },

    delete: async (id: string) => {
        await request<object>('DELETE', `connections/${id}`);
    },
};
