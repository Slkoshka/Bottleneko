import { request } from '../api/utils';
import { ScriptCode, ScriptDto } from '../api/dtos.gen';

export interface ListScriptsResponse {
    scripts: ScriptDto[];
}

export interface AddScriptResponse {
    script: ScriptDto;
}

export interface UpdateScriptResponse {
    script: ScriptDto;
}

export default {
    list: async (signal?: AbortSignal) => {
        return await request<ListScriptsResponse>('GET', 'scripts', { signal });
    },

    get: async (id: string, signal?: AbortSignal) => {
        return await request<ScriptDto>('GET', `scripts/${id}`, { signal });
    },

    add: async (name: string, description: string, code: ScriptCode) => {
        return await request<AddScriptResponse>('PUT', `scripts`, {
            body: {
                name,
                description,
                code,
            },
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

    update: async (id: string, script: { name?: string; description?: string; code?: ScriptCode; autoStart?: boolean }) => {
        return await request<UpdateScriptResponse>('PATCH', `scripts/${id}`, {
            body: script,
        });
    },

    delete: async (id: string) => {
        await request<object>('DELETE', `scripts/${id}`);
    },
};
