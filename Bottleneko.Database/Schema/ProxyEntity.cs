using Bottleneko.Api.Dtos;
using System.Net;

namespace Bottleneko.Database.Schema;

public class ProxyEntity : NamedEntity
{
    public required ProxyType Type { get; set; }
    public required string Hostname { get; set; }
    public required int Port { get; set; }
    public required bool IsAuthRequired { get; set; }
    public required string Username { get; set; }
    public required string Password { get; set; }

    public IWebProxy CreateProxy()
    {
        var kind = Uri.CheckHostName(Hostname);
        if (kind == UriHostNameType.Unknown)
        {
            throw new Exception($"Invalid proxy hostname: {Hostname}");
        }
        if (Port <= 0 || Port > 65535)
        {
            throw new Exception($"Invalid proxy port: {Port}");
        }

        var hostname = kind == UriHostNameType.IPv6 ? $"[{Hostname}]" : Hostname;
        var uri = new Uri($"{Type.ToString().ToLower()}://{hostname}:{Port}");
        var proxy = new WebProxy(uri)
        {
            Credentials = IsAuthRequired ?
                new NetworkCredential(Username, string.IsNullOrEmpty(Password) ? null : Password) :
                null,
        };
        return proxy;
    }
}
