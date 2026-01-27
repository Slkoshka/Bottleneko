import { request, type MutationRequestProperties, type RequestProperties } from '../utils';
import type { ScriptDto } from '../bottleneko.gen';

export interface ListScriptsResponse {
    result: ScriptDto[];
}

export interface AddScriptResponse {
    result: ScriptDto;
}

export interface UpdateScriptResponse {
    result: ScriptDto;
}

export default {
    list: async (props?: RequestProperties) => {
        return await request<ListScriptsResponse>('GET', 'scripts', props);
    },

    get: async (id: string, props?: RequestProperties) => {
        return await request<ScriptDto>('GET', `scripts/${id}`, props);
    },

    add: async (
        parameters: Partial<Omit<ScriptDto, 'id' | 'status' | 'autoStart'>>,
        props?: MutationRequestProperties,
    ) => {
        return await request<AddScriptResponse>('PUT', `scripts`, {
            body: parameters,
            ...props,
        });
    },

    start: async (id: string, props?: MutationRequestProperties) => {
        await request<object>('POST', `scripts/${id}/start`, props);
    },

    stop: async (id: string, props?: MutationRequestProperties) => {
        await request<object>('POST', `scripts/${id}/stop`, props);
    },

    restart: async (id: string, props?: MutationRequestProperties) => {
        await request<object>('POST', `scripts/${id}/restart`, props);
    },

    update: async (
        id: string,
        script: Partial<Omit<ScriptDto, 'id' | 'status'>>,
        props?: MutationRequestProperties,
    ) => {
        return await request<UpdateScriptResponse>('PATCH', `scripts/${id}`, {
            body: script,
            ...props,
        });
    },

    delete: async (id: string, props?: MutationRequestProperties) => {
        await request<object>('DELETE', `scripts/${id}`, props);
    },
};
