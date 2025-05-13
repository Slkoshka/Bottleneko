using Bottleneko.Actors;
using Bottleneko.Database.Schema;
using Bottleneko.Database;
using Bottleneko.Messages;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Bottleneko.Api.Dtos;
using Akka.Actor;
using Bottleneko.Logging;

namespace Bottleneko.Connections;

class ConnectionsCat(IServiceProvider services, INekoLogger logger) : ContainerCat<ConnectionInstance, ConnectionEntity, IConnectionsMessage.Add, IConnectionsMessage.Update, IConnectionsMessage.Remove>(services)
{
    public override async Task InitAsync(IActorRef self)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<NekoDbContext>();
        await foreach (var connection in db.Connections.Where(entity => !entity.IsDeleted).ToAsyncEnumerable())
        {
            self.Tell(new CreateChildActor(connection));
        }

        await base.InitAsync(self);
    }

    protected override async Task<ConnectionEntity> AddAsync(IConnectionsMessage.Add msg)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<NekoDbContext>();

        var entity = new ConnectionEntity()
        {
            Name = msg.Name,
            Protocol = msg.Protocol,
            AutoStart = msg.AutoStart,
            Configuration = msg.Configuration,
        };

        db.Connections.Add(entity);
        await db.SaveChangesAsync();

        return entity;
    }

    protected override async Task<ConnectionEntity> UpdateAsync(IConnectionsMessage.Update msg)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<NekoDbContext>();

        if (await db.Connections.SingleOrDefaultAsync(entity => entity.Id == msg.Id && !entity.IsDeleted) is ConnectionEntity entity)
        {
            entity.Name = msg.Name ?? entity.Name;
            entity.AutoStart = msg.AutoStart ?? entity.AutoStart;
            entity.Configuration = msg.Configuration ?? entity.Configuration;
            entity.LastUpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return entity;
        }
        else
        {
            throw new KeyNotFoundException("Not found");
        }
    }

    protected override async Task<bool> RemoveAsync(long id)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<NekoDbContext>();

        if (await db.Connections.SingleOrDefaultAsync(entity => entity.Id == id && !entity.IsDeleted) is ConnectionEntity entity)
        {
            entity.IsDeleted = true;
            entity.LastUpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return true;
        }
        else
        {
            return false;
        }
    }

    protected override bool CustomMessageHandler(object message)
    {
        switch (message)
        {
            case IConnectionsMessage.GetStatus getStatus:
                {
                    if (GetChild(getStatus.Id) is IActorRef child)
                    {
                        child.Forward(message);
                    }
                    else
                    {
                        Sender.Tell(ConnectionStatus.NotConnected);
                    }
                    return true;
                }

            case IConnectionsMessage.Get get:
            {
                if (GetChild(get.Id) is IActorRef child)
                {
                    child.Forward(message);
                }
                else
                {
                    Sender.Tell(null);
                }
                return true;
            }

            case ILoggingMessage.GetLogger getLogger:
                {
                    if (getLogger.Filter is { SourceType: LogSourceType.Connection, SourceId: not null } && GetChild(long.Parse(getLogger.Filter.SourceId)) is IActorRef child)
                    {
                        child.Forward(message);
                    }
                    else
                    {
                        Sender.Tell(logger);
                    }
                    return true;
                }

            default:
                return false;
        }
    }
}
