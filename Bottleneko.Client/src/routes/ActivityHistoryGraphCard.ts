import api from '$lib/api';
import type { ActivityStatsItemDto } from '$lib/api/dtos.gen';

export const getPeriod = (
    period: 'last-year' | 'last-month' | 'last-day' | 'last-hour',
    data: 'total-messages' | 'messages-per-minute',
) => {
    const dataCallback = (stats: ActivityStatsItemDto[]) => {
        switch (data) {
            case 'total-messages':
                return { id: data, data: stats.map((item) => item.totalMessages), label: '# of Messages' };

            case 'messages-per-minute':
                return {
                    id: data,
                    data: stats.map((item) => item.messagesPerMinute),
                    label: 'Messages per Minute',
                };
        }
    };

    switch (period) {
        case 'last-year':
            return {
                id: period,
                values: data,
                fetch: api.system.statsLastYear,
                name: 'Last Year',
                data: dataCallback,
            };

        case 'last-month':
            return {
                id: period,
                values: data,
                fetch: api.system.statsLastMonth,
                name: 'Last Month',
                data: dataCallback,
            };

        case 'last-day':
            return {
                id: period,
                values: data,
                fetch: api.system.statsLastDay,
                name: 'Last Day',
                data: dataCallback,
            };

        case 'last-hour':
            return {
                id: period,
                values: data,
                fetch: api.system.statsLastHour,
                name: 'Last Hour',
                data: dataCallback,
            };
    }
};
