import { request } from '../api/utils';
import { ScriptDto } from '../api/dtos.gen';

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
    list: async (signal?: AbortSignal) => {
        return await request<ListScriptsResponse>('GET', 'scripts', { signal });
    },

    get: async (id: string, signal?: AbortSignal) => {
        return await request<ScriptDto>('GET', `scripts/${id}`, { signal });
    },

    add: async (parameters: Partial<Omit<ScriptDto, 'id' | 'status' | 'autoStart'>>) => {
        return await request<AddScriptResponse>('PUT', `scripts`, {
            body: parameters,
        });
    },

    start: async (id: string) => {
        await request<object>('POST', `scripts/${id}/start`);
    },

    stop: async (id: string) => {
        await request<object>('POST', `scripts/${id}/stop`);
    },

    restart: async (id: string) => {
        await request<object>('POST', `scripts/${id}/restart`);
    },

    update: async (id: string, script: Partial<Omit<ScriptDto, 'id' | 'status'>>) => {
        return await request<UpdateScriptResponse>('PATCH', `scripts/${id}`, {
            body: script,
        });
    },

    delete: async (id: string) => {
        await request<object>('DELETE', `scripts/${id}`);
    },
};
