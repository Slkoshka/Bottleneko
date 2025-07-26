import { request } from '../api/utils';
import { EnvironmentInfoDto, ActivityStatsDto } from '../api/dtos.gen';

export default {
    getInfo: async (signal?: AbortSignal) => {
        return await request<EnvironmentInfoDto>('GET', `system/info`, { signal });
    },

    statsLastYear: async (signal?: AbortSignal) => {
        return await request<ActivityStatsDto>('GET', `system/stats/last_year`, { signal });
    },

    statsLastMonth: async (signal?: AbortSignal) => {
        return await request<ActivityStatsDto>('GET', `system/stats/last_month`, { signal });
    },

    statsLastDay: async (signal?: AbortSignal) => {
        return await request<ActivityStatsDto>('GET', `system/stats/last_day`, { signal });
    },

    statsLastHour: async (signal?: AbortSignal) => {
        return await request<ActivityStatsDto>('GET', `system/stats/last_hour`, { signal });
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
