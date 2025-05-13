import { request } from '../api/utils';
import { EnvironmentInfoDto } from '../api/dtos.gen';

export default {
    getInfo: async (signal?: AbortSignal) => {
        return await request<EnvironmentInfoDto>('GET', `system/info`, { signal });
    },

    restart: async () => {
        return await request<object>('POST', `system/restart`);
    },

    shutdown: async () => {
        return await request<object>('POST', `system/shutdown`);
    },

    setup: async (username: string, password: string) => {
        return await request<object>('POST', `system/setup/`, {
            body: {
                username,
                password,
            },
        });
    },
};
