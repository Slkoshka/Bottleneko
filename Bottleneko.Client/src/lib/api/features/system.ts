import { request, type MutationRequestProperties, type RequestProperties } from '../utils';
import type { EnvironmentInfoDto, ActivityStatsDto } from '../dtos.gen';

export default {
    getInfo: async (props?: RequestProperties) => {
        return await request<EnvironmentInfoDto>('GET', `system/info`, props);
    },

    statsLastYear: async (props?: RequestProperties) => {
        return await request<ActivityStatsDto>('GET', `system/stats/last_year`, props);
    },

    statsLastMonth: async (props?: RequestProperties) => {
        return await request<ActivityStatsDto>('GET', `system/stats/last_month`, props);
    },

    statsLastDay: async (props?: RequestProperties) => {
        return await request<ActivityStatsDto>('GET', `system/stats/last_day`, props);
    },

    statsLastHour: async (props?: RequestProperties) => {
        return await request<ActivityStatsDto>('GET', `system/stats/last_hour`, props);
    },

    restart: async (props?: RequestProperties) => {
        return await request<object>('POST', `system/restart`, props);
    },

    shutdown: async (props?: RequestProperties) => {
        return await request<object>('POST', `system/shutdown`, props);
    },

    setup: async (username: string, password: string, props?: MutationRequestProperties) => {
        return await request<object>('POST', `system/setup/`, {
            body: {
                username,
                password,
            },
            ...props,
        });
    },
};
