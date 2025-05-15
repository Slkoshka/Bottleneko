import { ProxyType } from '../api/dtos.gen';

export const proxyTypeMap: Record<ProxyType, { type: ProxyType; name: string; description: string }> = {
    [ProxyType.Http]: { type: ProxyType.Http, name: 'HTTP', description: 'Most common proxy type' },
    [ProxyType.Https]: { type: ProxyType.Https, name: 'HTTPS', description: 'HTTP proxy with encryption' },
    [ProxyType.Socks4]: { type: ProxyType.Socks4, name: 'SOCKS4', description: 'SOCKS proxy with no or password-only authentication' },
    [ProxyType.Socks4a]: { type: ProxyType.Socks4a, name: 'SOCKS4a', description: 'Extended SOCKS4 version with the support for server-side DNS requests' },
    [ProxyType.Socks5]: { type: ProxyType.Socks5, name: 'SOCKS5', description: 'SOCKS proxy with username and password authentication' },
};

export const proxyTypes = Object.values(proxyTypeMap);
