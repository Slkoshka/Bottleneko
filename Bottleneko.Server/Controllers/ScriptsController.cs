using Bottleneko.Actors;
using Bottleneko.Api.Dtos;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Messages;
using Bottleneko.Server.Utils;
using Bottleneko.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bottleneko.Server.Controllers;

public class ScriptsController(NekoDbContext db, AkkaService akka) : CrudController<ScriptsController.CreateScriptRequest, ScriptsController.UpdateScriptRequest>
{
    public record CreateScriptRequest(string Name, string Description, ScriptCode Code);

    public override async Task<IActionResult> AddAsync([FromBody] CreateScriptRequest request)
    {
        var script = await akka.AskAsync(new ScriptingMessages.Add(request.Name, request.Description, request.Code, true).ToScripting().WithReply<ScriptEntity>());
        return Ok(new
        {
            Result = script.ToDto(ScriptStatus.Starting),
        });
    }

    public override async Task<IActionResult> ListAsync()
    {
        return Ok(new
        {
            Result = await Task.WhenAll((await db.Scripts.Where(connection => !connection.IsDeleted).ToArrayAsync()).Select(async script =>
            {
                ScriptStatus status;
                try
                {
                    status = await akka.AskAsync(new ScriptingMessages.GetStatus().ToScript(script.Id).WithReply<ScriptStatus>());
                }
                catch (RouteNotFoundException)
                {
                    status = ScriptStatus.Stopped;
                }
                return script.ToDto(status);
            })),
        });
    }

    public override async Task<IActionResult> GetAsync([FromRoute] long id)
    {
        if (await db.Scripts.SingleOrDefaultAsync(s => s.Id == id && !s.IsDeleted) is { } script)
        {
            return Ok(script.ToDto(await akka.AskAsync(new ScriptingMessages.GetStatus().ToScript(id).WithReply<ScriptStatus>())));
        }
        else
        {
            return Error(ErrorCode.NotFound, "Script not found");
        }
    }

    public record UpdateScriptRequest(string? Name, string? Description, ScriptCode? Code, bool? AutoStart);

    public override async Task<IActionResult> UpdateAsync([FromRoute] long id, [FromBody] UpdateScriptRequest request)
    {
        try
        {
            var script = await akka.AskAsync(new ScriptingMessages.Update(id, request.Name, request.Description, request.Code, request.AutoStart).ToScripting().WithReply<ScriptEntity>());
            return Ok(new
            {
                Result = script.ToDto(await akka.AskAsync(new ScriptingMessages.GetStatus().ToScript(id).WithReply<ScriptStatus>())),
            });
        }
        catch (KeyNotFoundException)
        {
            return Error(ErrorCode.NotFound, "Script not found");
        }
    }

    public override async Task<IActionResult> DeleteAsync([FromRoute] long id)
    {
        if (await akka.AskAsync(new ScriptingMessages.Remove(id).ToScripting().WithReply<bool>()))
        {
            return Ok(new Success());
        }
        else
        {
            return Error(ErrorCode.NotFound, "Script not found");
        }
    }

    [HttpPost("{id:long}/start")]
    public IActionResult Start([FromRoute] long id)
    {
        akka.Tell(ContainerMessages.Start.Instance.ToScript(id));
        return Ok(new Success());
    }

    [HttpPost("{id:long}/stop")]
    public IActionResult Stop([FromRoute] long id)
    {
        akka.Tell(ContainerMessages.Stop.Instance.ToScript(id));
        return Ok(new Success());
    }

    [HttpPost("{id:long}/restart")]
    public IActionResult Restart([FromRoute] long id)
    {
        akka.Tell(ContainerMessages.Restart.Instance.ToScript(id));
        return Ok(new Success());
    }
}