using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Dtos;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Bottleneko.Scripting;

class ScriptingCat(IServiceProvider services, INekoLogger logger) : ContainerCat<ScriptInstance, ScriptEntity, IScriptingMessage.Add, IScriptingMessage.Update, IScriptingMessage.Remove>(services)
{
    public override async Task InitAsync(IActorRef self)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<NekoDbContext>();
        await foreach (var script in db.Scripts.Where(entity => !entity.IsDeleted).ToAsyncEnumerable())
        {
            self.Tell(new CreateChildActor(script));
        }

        await base.InitAsync(self);
    }

    protected override async Task<ScriptEntity> AddAsync(IScriptingMessage.Add msg)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<NekoDbContext>();

        var entity = new ScriptEntity()
        {
            Name = msg.Name,
            Description = msg.Description,
            Code = msg.Code,
            AutoStart = msg.AutoStart,
        };

        db.Scripts.Add(entity);
        await db.SaveChangesAsync();

        return entity;
    }

    protected override async Task<ScriptEntity> UpdateAsync(IScriptingMessage.Update msg)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<NekoDbContext>();

        if (await db.Scripts.SingleOrDefaultAsync(entity => entity.Id == msg.Id && !entity.IsDeleted) is ScriptEntity entity)
        {
            entity.Name = msg.Name ?? entity.Name;
            entity.Description = msg.Description ?? entity.Description;
            entity.Code = msg.Code ?? entity.Code;
            entity.AutoStart = msg.AutoStart ?? entity.AutoStart;
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

        if (await db.Scripts.SingleOrDefaultAsync(entity => entity.Id == id && !entity.IsDeleted) is ScriptEntity entity)
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
            case IScriptingMessage.GetStatus getStatus:
                {
                    if (GetChild(getStatus.Id) is IActorRef child)
                    {
                        child.Forward(message);
                    }
                    else
                    {
                        Sender.Tell(ScriptStatus.Stopped);
                    }
                    return true;
                }

            case ILoggingMessage.GetLogger getLogger:
                {
                    if (getLogger.Filter is { SourceType: LogSourceType.Script, SourceId: not null } && GetChild(long.Parse(getLogger.Filter.SourceId)) is IActorRef child)
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
