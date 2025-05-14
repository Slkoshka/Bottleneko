using Bottleneko.Api.Dtos;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Messages;
using Bottleneko.Server.Utils;
using Bottleneko.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bottleneko.Server.Controllers;

public class ProxiesController(AkkaService akka, NekoDbContext db) : CrudController<ProxiesController.AddProxyRequest, ProxiesController.UpdateProxyRequest>
{
    public record AddProxyRequest(string Name, ProxyType Type, string Hostname, int Port, bool IsAuthRequired, string Username, string Password);

    public override async Task<IActionResult> AddAsync([FromBody] AddProxyRequest request)
    {
        var proxy = new ProxyEntity()
        {
            Name = request.Name,
            Type = request.Type,
            Hostname = request.Hostname,
            Port = request.Port,
            IsAuthRequired = request.IsAuthRequired,
            Username = request.Username,
            Password = request.Password
        };

        await db.Proxies.AddAsync(proxy);
        await db.SaveChangesAsync();

        return Ok(new
        {
            Proxy = proxy.ToDto(),
        });
    }

    public override async Task<IActionResult> DeleteAsync([FromRoute] long id)
    {
        if (await db.Proxies.SingleOrDefaultAsync(proxy => proxy.Id == id && !proxy.IsDeleted) is ProxyEntity proxy)
        {
            proxy.IsDeleted = true;
            proxy.LastUpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            akka.Tell(new IConnectionsMessage.ProxyUpdated(id));

            return Ok();
        }
        else
        {
            return NotFound("Proxy not found");
        }
    }

    public override async Task<IActionResult> GetAsync([FromRoute] long id)
    {
        if (await db.Proxies.SingleOrDefaultAsync(proxy => proxy.Id == id && !proxy.IsDeleted) is ProxyEntity proxy)
        {
            return Ok(proxy.ToDto());
        }
        else
        {
            return NotFound("Proxy not found");
        }
    }

    public override async Task<IActionResult> ListAsync()
    {
        return Ok(new
        {
            Proxies = (await db.Proxies.Where(proxy => !proxy.IsDeleted).ToArrayAsync()).Select(proxy => proxy.ToDto()),
        });
    }

    public record UpdateProxyRequest(string? Name, string? Hostname, int? Port, bool? IsAuthRequired, string? Username, string? Password);

    public override async Task<IActionResult> UpdateAsync([FromRoute] long id, [FromBody] UpdateProxyRequest request)
    {
        if (await db.Proxies.SingleOrDefaultAsync(proxy => proxy.Id == id && !proxy.IsDeleted) is ProxyEntity proxy)
        {
            var proxyUpdated =
                (request.Hostname is not null && request.Hostname != proxy.Hostname) ||
                (request.Port is not null && request.Port != proxy.Port) ||
                (request.IsAuthRequired is not null && request.IsAuthRequired != proxy.IsAuthRequired) ||
                (request.IsAuthRequired == true && request.Username is not null && request.Username != proxy.Username) ||
                (request.IsAuthRequired == true && request.Password is not null && request.Password != proxy.Password);

            proxy.Name = request.Name ?? proxy.Name;
            proxy.Hostname = request.Hostname ?? proxy.Hostname;
            proxy.Port = request.Port ?? proxy.Port;
            proxy.IsAuthRequired = request.IsAuthRequired ?? proxy.IsAuthRequired;
            proxy.Username = proxy.IsAuthRequired ? request.Username ?? proxy.Username : "";
            proxy.Password = proxy.IsAuthRequired ? request.Password ?? proxy.Password : "";
            proxy.LastUpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            if (proxyUpdated)
            {
                akka.Tell(new IConnectionsMessage.ProxyUpdated(id));
            }

            return Ok(new
            {
                Proxy = proxy.ToDto(),
            });
        }
        else
        {
            return NotFound("Proxy not found");
        }
    }
}
