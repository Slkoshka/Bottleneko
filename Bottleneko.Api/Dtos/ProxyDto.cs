namespace Bottleneko.Api.Dtos;

public enum ProxyType
{
    Http,
    Https,
    Socks4,
    Socks4a,
    Socks5,
}

public record ProxyDto(string Id, string Name, ProxyType Type, string Hostname, int Port, bool IsAuthRequired, string Username, string Password);
