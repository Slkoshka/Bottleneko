import { type ProxyDto, type ProxyType } from '$lib/api/dtos.gen';
import api from '$lib/api';
import { EntityProvider, LocalEntity } from '$lib/provider.svelte';

export const proxyTypeMap: Record<ProxyType, { type: ProxyType; name: string; description: string }> = {
    ['Http']: { type: 'Http', name: 'HTTP', description: 'Most common proxy type' },
    ['Https']: { type: 'Https', name: 'HTTPS', description: 'HTTP proxy with encryption' },
    ['Socks4']: { type: 'Socks4', name: 'SOCKS4', description: 'SOCKS proxy with no or password-only authentication' },
    ['Socks4a']: {
        type: 'Socks4a',
        name: 'SOCKS4a',
        description: 'Extended SOCKS4 version with the support for server-side DNS requests',
    },
    ['Socks5']: {
        type: 'Socks5',
        name: 'SOCKS5',
        description: 'SOCKS proxy with username and password authentication',
    },
};

export const proxyTypes = Object.values(proxyTypeMap);

export const state = $state({
    provider: null as ProxiesProvider | null,
});

export class LocalProxy extends LocalEntity<
    ProxyDto,
    Parameters<typeof api.proxies.add>[0],
    Parameters<typeof api.proxies.update>[1]
> {
    override canDelete = true;
    info = $derived({
        id: {
            name: 'ID',
            value: this.data.id,
        },
        name: {
            name: 'Name',
            value: this.data.name,
        },
        type: {
            name: 'Type',
            value: proxyTypeMap[this.data.type].name,
        },
        address: {
            name: 'Address',
            value: `${this.data.hostname}:${this.data.port.toString()}`,
        },
    });

    constructor(proxy: ProxyDto) {
        super(api.proxies, proxy);
    }
}

export class ProxiesProvider extends EntityProvider<
    ProxyDto,
    Parameters<typeof api.proxies.add>[0],
    Parameters<typeof api.proxies.update>[1],
    LocalProxy
> {
    constructor() {
        super(api.proxies, (proxy) => new LocalProxy(proxy));
    }

    static factory() {
        state.provider = new ProxiesProvider();

        return {
            destroy() {
                state.provider?.destroy();
                state.provider = null;
            },
        };
    }
}
