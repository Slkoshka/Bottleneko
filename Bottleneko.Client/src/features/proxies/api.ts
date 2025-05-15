import { request } from '../api/utils';
import { ProxyDto, ProxyType } from '../api/dtos.gen';

export interface ListProxysResponse {
    proxies: ProxyDto[];
}

export interface AddProxyResponse {
    proxy: ProxyDto;
}

export interface UpdateProxyResponse {
    proxy: ProxyDto;
}

export default {
    list: async (signal?: AbortSignal) => {
        return await request<ListProxysResponse>('GET', 'proxies', { signal });
    },

    get: async (id: string, signal?: AbortSignal) => {
        return await request<ProxyDto>('GET', `proxies/${id}`, { signal });
    },

    add: async (name: string, type: ProxyType, hostname: string, port: number, auth?: { username: string; password?: string }) => {
        return await request<AddProxyResponse>('PUT', `proxies`, {
            body: {
                name,
                type,
                hostname,
                port,
                isAuthRequired: !!auth,
                username: auth?.username ?? '',
                password: auth?.password ?? '',
            },
        });
    },

    update: async (id: string, proxy: { name?: string; type?: ProxyType; hostname?: string; port?: number; auth?: { username?: string; password?: string } }) => {
        return await request<UpdateProxyResponse>('PATCH', `proxies/${id}`, {
            body: {
                name: proxy.name,
                type: proxy.type,
                hostname: proxy.hostname,
                port: proxy.port,
                isAuthRequired: proxy.auth ? true : null,
                username: proxy.auth?.username ?? null,
                password: proxy.auth?.password ?? null,
            },
        });
    },

    delete: async (id: string) => {
        await request<object>('DELETE', `proxies/${id}`);
    },
};
