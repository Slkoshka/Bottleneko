using System.Diagnostics;
using Bottleneko.Actors;
using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;
using Bottleneko.Api.Rpc;
using Bottleneko.Api.Rpc.Services;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Protocols;
using Bottleneko.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Bottleneko.Rpc.Services;

public class ConnectionsRpcService(IServiceProvider services, INekoLogger logger, AkkaService akka) : IConnectionsService
{
    public async Task<ConnectionDto> GetAsync(IRpcContext context, long id)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
            {
                using var db = NekoDbContext.Get();
                if (await db.Connections.SingleOrDefaultAsync(connection => connection.Id == id && !connection.IsDeleted) is ConnectionEntity connection)
                {
                    return connection.ToDto(await akka.AskAsync(ConnectionMessages.GetStatus.Instance.ToConnection(id).WithReply<ExtendedConnectionStatus>()));
                }
                else
                {
                    throw new Exception("Connection not found");
                }
            }
        }
    }

    public async Task<ConnectionDto[]> ListAsync(IRpcContext context)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
            {
                using var db = NekoDbContext.Get();
                return await Task.WhenAll((await db.Connections.Where(connection => !connection.IsDeleted).ToArrayAsync()).Select(async connection =>
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
                }));
            }
        }
    }

    public async Task<IConnectionsService.ConnectionTestResult> TestAsync(IRpcContext context, Protocol protocol, ProtocolConfiguration config)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
            {
                var protocolRegistry = services.GetRequiredService<ProtocolRegistry>();
                var timer = Stopwatch.StartNew();

                try
                {
                    var connectionType = protocolRegistry.GetProtocol(protocol);

                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10.0));
                    try
                    {
                        var extra = await connectionType.Test(new ProtocolContext(services, logger), config, cts.Token);
                        timer.Stop();

                        return new(timer.Elapsed, extra);
                    }
                    catch (OperationCanceledException)
                    {
                        throw new RpcException(ErrorCode.Timeout, "Connection took too long to respond (network issue?)");
                    }
                }
                catch (AggregateException e)
                {
                    throw new RpcException(ErrorCode.ConnectionError, e.InnerExceptions.Count > 0 ? string.Join("\n", e.InnerExceptions.Select(exception => exception.Message)) : e.Message);
                }
                catch (Exception e)
                {
                    throw new RpcException(ErrorCode.ConnectionError, e.Message);
                }
            }
        }
    }

    public async Task<ConnectionDto> AddAsync(IRpcContext context, string name, Protocol protocol, ProtocolConfiguration config)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
                var connection = await akka.AskAsync(new ConnectionMessages.Add(name, protocol, true, config).ToConnections().WithReply<ConnectionEntity>());
                return connection.ToDto(new(ConnectionStatus.Connecting));
        }
    }

    public async Task DeleteAsync(IRpcContext context, long id)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
                if (!await akka.AskAsync(new ConnectionMessages.Remove(id).ToConnections().WithReply<bool>()))
                {
                    throw new RpcException(ErrorCode.NotFound, "Connection not found");
                }
                break;
        }
    }

    public async Task<ConnectionDto> UpdateAsync(IRpcContext context, long id, string? name, ProtocolConfiguration? config, bool? autoStart)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
                var connection = await akka.AskAsync(new ConnectionMessages.Update(id, name, autoStart, config).ToConnections().WithReply<ConnectionEntity>());
                return connection.ToDto(await akka.AskAsync(ConnectionMessages.GetStatus.Instance.ToConnection(id).WithReply<ExtendedConnectionStatus>()));
        }
    }

    public async Task<string> GetAttachmentUrlAsync(IRpcContext context, long id, long attachmentId)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
            {
                using var db = NekoDbContext.Get();
                var attachment = await db.MessageAttachments.SingleOrDefaultAsync(attachment => attachment.Id == attachmentId);
                if (attachment?.Message.ConnectionId != id)
                {
                    throw new RpcException(ErrorCode.NotFound, "Attachment not found");
                }

                return
                    attachment.Url ??
                    await akka.AskAsync(new ConnectionMessages.GetAttachment(attachmentId).ToConnection(id).WithReply<string?>()) ??
                    throw new RpcException(ErrorCode.NotFound, "Attachment not found");
            }
        }
    }

    public void Start(IRpcContext context, long id)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
                akka.Tell(ContainerMessages.Start.Instance.ToConnection(id));    
                break;
        }
    }

    public void Restart(IRpcContext context, long id)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
                akka.Tell(ContainerMessages.Restart.Instance.ToConnection(id));    
                break;
        }
    }

    public void Stop(IRpcContext context, long id)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
                akka.Tell(ContainerMessages.Stop.Instance.ToConnection(id));    
                break;
        }
    }
}
