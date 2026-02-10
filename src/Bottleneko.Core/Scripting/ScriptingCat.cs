using System.Security.Cryptography;
using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Bottleneko.Scripting;

class ScriptingCat(IServiceProvider services, INekoLogger logger) : ContainerCat<ScriptInstance, ScriptEntity, ScriptingMessages.Add, ScriptingMessages.Update, ScriptingMessages.Remove>(services)
{
    private readonly Dictionary<string, (IActorRef Actor, long Id)> _accessTokens = [];

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

    protected override async Task<ScriptEntity> AddAsync(ScriptingMessages.Add msg)
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

    protected override async Task<ScriptEntity> UpdateAsync(ScriptingMessages.Update msg)
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

    private static string GenerateToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(128));
    }

    protected override void ChildCreated(IActorRef child, long id)
    {
        _accessTokens[GenerateToken()] = (child, id);
    }

    protected override void ChildDestroyed(IActorRef child, long id)
    {
        foreach (var (token, actor) in _accessTokens)
        {
            if (actor.Actor == child)
            {
                _accessTokens.Remove(token);
                break;
            }
        }
    }

    protected override bool CustomMessageHandler(object message)
    {
        switch (message)
        {
            case ScriptingMessages.GetAccessToken getAccessToken:
            {
                foreach (var (token, actor) in _accessTokens)
                {
                    if (actor.Id == getAccessToken.Id)
                    {
                        Sender.Tell(token);
                        return true;
                    }
                }
                Sender.Tell(null);
                return true;
            }

            case ScriptingMessages.Authenticate authenticate:
            {
                if (_accessTokens.Remove(authenticate.AccessToken, out var actor))
                {
                    _accessTokens[GenerateToken()] = actor;
                    Sender.Tell(actor, Self);
                }
                return true;
            }

            case LoggingMessages.GetLogger:
            {
                Sender.Tell(logger);
                return true;
            }

            default:
                return false;
        }
    }
}
