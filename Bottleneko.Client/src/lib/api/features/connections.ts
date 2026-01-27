import type { ConnectionDto, ProtocolConfiguration } from '../bottleneko.gen';
import { request, type MutationRequestProperties, type RequestProperties } from '../utils';

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
    list: async (props?: RequestProperties) => {
        return await request<ListConnectionsResponse>('GET', 'connections', props);
    },

    get: async (id: string, props?: RequestProperties) => {
        return await request<ConnectionDto>('GET', `connections/${id}`, props);
    },

    test: async (config: ProtocolConfiguration, props?: RequestProperties) => {
        return await request<TestConnectionResponse>('POST', `connections/test`, {
            body: {
                protocol: config.$type,
                config,
            },
            ...props,
        });
    },

    add: async (parameters: { name: string; config: ProtocolConfiguration }, props?: MutationRequestProperties) => {
        return await request<AddConnectionResponse>('PUT', `connections`, {
            body: {
                protocol: parameters.config.$type,
                name: parameters.name,
                config: parameters.config,
            },
            ...props,
        });
    },

    getAttachmentUrl: (connectionId: string, attachmentId: string) => {
        return `/api/connections/${connectionId}/attachments/${attachmentId}?download=1`;
    },

    start: async (id: string, props?: MutationRequestProperties) => {
        await request<object>('POST', `connections/${id}/start`, props);
    },

    stop: async (id: string, props?: MutationRequestProperties) => {
        await request<object>('POST', `connections/${id}/stop`, props);
    },

    restart: async (id: string, props?: MutationRequestProperties) => {
        await request<object>('POST', `connections/${id}/restart`, props);
    },

    update: async (
        id: string,
        connection: Partial<Omit<ConnectionDto, 'id' | 'protocol' | 'extendedStatus'>>,
        props?: MutationRequestProperties,
    ) => {
        return await request<UpdateConnectionResponse>('PATCH', `connections/${id}`, {
            body: connection,
            ...props,
        });
    },

    delete: async (id: string, props?: MutationRequestProperties) => {
        await request<object>('DELETE', `connections/${id}`, props);
    },
};
