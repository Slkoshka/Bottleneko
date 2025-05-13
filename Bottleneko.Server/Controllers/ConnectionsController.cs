using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Text.Json;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Protocols;
using Microsoft.EntityFrameworkCore;
using Bottleneko.Api.Dtos;
using Bottleneko.Server.Utils;
using Bottleneko.Api.Protocols;
using Bottleneko.Services;
using Bottleneko.Messages;
using System.Web;

namespace Bottleneko.Server.Controllers;

[Authorize]
public class ConnectionsController(IOptions<JsonOptions> jsonOptions, ProtocolRegistry protocolRegistry, AkkaService akka, NekoDbContext db) : CrudController<ConnectionsController.AddConnectionRequest, ConnectionsController.UpdateConnectionRequest>
{
    public override async Task<IActionResult> ListAsync()
    {
        return Ok(new
        {
            Connections = await Task.WhenAll((await db.Connections.Where(connection => !connection.IsDeleted).ToArrayAsync()).Select(async connection => connection.ToDto(await akka.AskAsync<ConnectionStatus>(new IConnectionsMessage.GetStatus(connection.Id))))),
        });
    }

    public record TestConnectionRequest(Protocol Protocol, JsonDocument Config);

    [HttpPost("test")]
    public async Task<IActionResult> TestAsync([FromBody] TestConnectionRequest request)
    {
        var timer = Stopwatch.StartNew();

        try
        {
            var connectionType = protocolRegistry.GetProtocol(request.Protocol);
            var config = request.Config.Deserialize(connectionType.ConfigType, jsonOptions.Value.JsonSerializerOptions) ?? throw new ArgumentException("Empty Connection configs are not supported");

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10.0));
            try
            {
                var extra = await protocolRegistry.TestAsync(connectionType, config, cts.Token);
                timer.Stop();

                return Ok(new
                {
                    Duration = timer.Elapsed,
                    Extra = extra,
                });
            }
            catch (OperationCanceledException)
            {
                return Error(ErrorCode.Timeout, "Connection took too long to respond (network issue?)");
            }
        }
        catch (AggregateException e)
        {
            return Error(ErrorCode.ConnectionError, e.InnerExceptions.Count > 0 ? string.Join("\n", e.InnerExceptions.Select(exception => exception.Message)) : e.Message);
        }
        catch (Exception e)
        {
            return Error(ErrorCode.ConnectionError, e.Message);
        }
    }

    public record AddConnectionRequest(string Name, Protocol Protocol, JsonDocument Config);

    public override async Task<IActionResult> AddAsync([FromBody] AddConnectionRequest request)
    {
        if (!protocolRegistry.TryGetProtocol(request.Protocol, out var connectionType))
        {
            return Error(ErrorCode.NotFound, "Connection type not found");
        }

        var config = request.Config.Deserialize(connectionType.ConfigType, jsonOptions.Value.JsonSerializerOptions) as ProtocolConfiguration ?? throw new ArgumentException("Empty Connection configs are not supported");

        var connection = await akka.AskAsync<ConnectionEntity>(new IConnectionsMessage.Add(request.Name, request.Protocol, true, config));

        return Ok(new
        {
            Connection = connection.ToDto(ConnectionStatus.Connecting),
        });
    }

    public override async Task<IActionResult> DeleteAsync([FromRoute] long id)
    {
        if (await akka.AskAsync<bool>(new IConnectionsMessage.Remove(id)))
        {
            return Ok();
        }
        else
        {
            return Error(ErrorCode.NotFound, "Connection not found");
        }
    }

    public override async Task<IActionResult> GetAsync([FromRoute] long id)
    {
        if (await db.Connections.SingleOrDefaultAsync(connection => connection.Id == id && !connection.IsDeleted) is ConnectionEntity connection)
        {
            return Ok(connection.ToDto(await akka.AskAsync<ConnectionStatus>(new IConnectionsMessage.GetStatus(id))));
        }
        else
        {
            return Error(ErrorCode.NotFound, "Connection not found");
        }
    }

    public record UpdateConnectionRequest(string? Name, ProtocolConfiguration? Config, bool? AutoStart);

    public override async Task<IActionResult> UpdateAsync([FromRoute] long id, [FromBody] UpdateConnectionRequest request)
    {
        try
        {
            var connection = await akka.AskAsync<ConnectionEntity>(new IConnectionsMessage.Update(id, request.Name, request.AutoStart, request.Config));
            return Ok(new
            {
                Connection = connection.ToDto(await akka.AskAsync<ConnectionStatus>(new IConnectionsMessage.GetStatus(id))),
            });
        }
        catch (KeyNotFoundException)
        {
            return Error(ErrorCode.NotFound, "Connection not found");
        }
    }

    [HttpGet("{id:long}/attachments/{attachmentId}")]
    public async Task<IActionResult> GetAttachmentAsync([FromRoute] long id, [FromRoute] long attachmentId)
    {
        var attachment = await db.MessageAttachments.SingleOrDefaultAsync(attachment => attachment.Id == attachmentId);
        if (attachment?.Message.ConnectionId != id)
        {
            return Error(ErrorCode.NotFound, "Attachment not found");
        }

        if (attachment.Url is not null)
        {
            return RedirectPermanent(attachment.Url);
        }

        return await akka.AskAsync<object>(new IConnectionsMessage.GetAttachment(id, attachmentId)) switch
        {
            string url => Redirect(url),
            _ => Error(ErrorCode.NotFound, "Attachment not found"),
        };
    }

    [HttpPost("{id:long}/start")]
    public IActionResult Start([FromRoute] long id)
    {
        akka.Tell(new IConnectionsMessage.Start(id));
        return Ok(new Success());
    }

    [HttpPost("{id:long}/stop")]
    public IActionResult Stop([FromRoute] long id)
    {
        akka.Tell(new IConnectionsMessage.Stop(id));
        return Ok(new Success());
    }

    [HttpPost("{id:long}/restart")]
    public IActionResult Restart([FromRoute] long id)
    {
        akka.Tell(new IConnectionsMessage.Restart(id));
        return Ok(new Success());
    }
}
