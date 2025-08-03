import { request } from '../api/utils';
import { ProxyDto } from '../api/dtos.gen';

export interface ListProxiesResponse {
    result: ProxyDto[];
}

export interface AddProxyResponse {
    result: ProxyDto;
}

export interface UpdateProxyResponse {
    result: ProxyDto;
}

export default {
    list: async (signal?: AbortSignal) => {
        return await request<ListProxiesResponse>('GET', 'proxies', { signal });
    },

    get: async (id: string, signal?: AbortSignal) => {
        return await request<ProxyDto>('GET', `proxies/${id}`, { signal });
    },

    add: async (proxy: Partial<Omit<ProxyDto, 'id'>>) => {
        return await request<AddProxyResponse>('PUT', `proxies`, {
            body: proxy,
        });
    },

    update: async (id: string, proxy: Partial<Omit<ProxyDto, 'id'>>) => {
        return await request<UpdateProxyResponse>('PATCH', `proxies/${id}`, {
            body: proxy,
        });
    },

    delete: async (id: string) => {
        await request<object>('DELETE', `proxies/${id}`);
    },
};
