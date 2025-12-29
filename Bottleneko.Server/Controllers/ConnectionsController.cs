using Bottleneko.Actors;
using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Protocols;
using Bottleneko.Server.Utils;
using Bottleneko.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Text.Json;

namespace Bottleneko.Server.Controllers;

[Authorize]
public class ConnectionsController(IServiceProvider services, IOptions<JsonOptions> jsonOptions, ProtocolRegistry protocolRegistry, AkkaService akka, NekoDbContext db, INekoLogger logger) : CrudController<ConnectionsController.AddConnectionRequest, ConnectionsController.UpdateConnectionRequest>
{
    public override async Task<IActionResult> ListAsync()
    {
        return Ok(new
        {
            Result = await Task.WhenAll((await db.Connections.Where(connection => !connection.IsDeleted).ToArrayAsync()).Select(async connection =>
            {
                ExtendedConnectionStatus status;
                try
                {
                    status = await akka.AskAsync(ConnectionMessages.GetStatus.Instance.ToConnection(connection.Id).WithReply<ExtendedConnectionStatus>());
                }
                catch (RouteNotFoundException)
                {
                    status = new ExtendedConnectionStatus(ConnectionStatus.NotConnected);
                }
                return connection.ToDto(status);
            })),
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
            var config = (ProtocolConfiguration?)request.Config.Deserialize(connectionType.ConfigType, jsonOptions.Value.JsonSerializerOptions) ?? throw new ArgumentException("Empty Connection configs are not supported");

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10.0));
            try
            {
                var extra = await connectionType.Test(new ProtocolContext(services, logger), config, cts.Token);
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

        var connection = await akka.AskAsync(new ConnectionMessages.Add(request.Name, request.Protocol, true, config).ToConnections().WithReply<ConnectionEntity>());

        return Ok(new
        {
            Result = connection.ToDto(new(ConnectionStatus.Connecting)),
        });
    }

    public override async Task<IActionResult> DeleteAsync([FromRoute] long id)
    {
        if (await akka.AskAsync(new ConnectionMessages.Remove(id).ToConnections().WithReply<bool>()))
        {
            return Ok(new Success());
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
            return Ok(connection.ToDto(await akka.AskAsync(ConnectionMessages.GetStatus.Instance.ToConnection(id).WithReply<ExtendedConnectionStatus>())));
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
            var connection = await akka.AskAsync(new ConnectionMessages.Update(id, request.Name, request.AutoStart, request.Config).ToConnections().WithReply<ConnectionEntity>());
            return Ok(new
            {
                Result = connection.ToDto(await akka.AskAsync(ConnectionMessages.GetStatus.Instance.ToConnection(id).WithReply<ExtendedConnectionStatus>())),
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

        return await akka.AskAsync(new ConnectionMessages.GetAttachment(attachmentId).ToConnection(id).WithReply<object>()) switch
        {
            string url => Redirect(url),
            _ => Error(ErrorCode.NotFound, "Attachment not found"),
        };
    }

    [HttpPost("{id:long}/start")]
    public IActionResult Start([FromRoute] long id)
    {
        akka.Tell(ContainerMessages.Start.Instance.ToConnection(id));
        return Ok(new Success());
    }

    [HttpPost("{id:long}/stop")]
    public IActionResult Stop([FromRoute] long id)
    {
        akka.Tell(ContainerMessages.Stop.Instance.ToConnection(id));
        return Ok(new Success());
    }

    [HttpPost("{id:long}/restart")]
    public IActionResult Restart([FromRoute] long id)
    {
        akka.Tell(ContainerMessages.Restart.Instance.ToConnection(id));
        return Ok(new Success());
    }
}
