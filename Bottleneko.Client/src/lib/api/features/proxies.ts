import { request, type MutationRequestProperties, type RequestProperties } from '../utils';
import type { ProxyDto } from '../dtos.gen';

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
    list: async (props?: RequestProperties) => {
        return await request<ListProxiesResponse>('GET', 'proxies', props);
    },

    get: async (id: string, props?: RequestProperties) => {
        return await request<ProxyDto>('GET', `proxies/${id}`, props);
    },

    add: async (proxy: Partial<Omit<ProxyDto, 'id'>>, props?: MutationRequestProperties) => {
        return await request<AddProxyResponse>('PUT', `proxies`, {
            body: proxy,
            ...props,
        });
    },

    update: async (id: string, proxy: Partial<Omit<ProxyDto, 'id'>>, props?: MutationRequestProperties) => {
        return await request<UpdateProxyResponse>('PATCH', `proxies/${id}`, {
            body: proxy,
            ...props,
        });
    },

    delete: async (id: string, props?: MutationRequestProperties) => {
        await request<object>('DELETE', `proxies/${id}`, props);
    },
};
