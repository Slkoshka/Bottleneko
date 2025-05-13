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
        var script = await akka.AskAsync<ScriptEntity>(new IScriptingMessage.Add(request.Name, request.Description, request.Code, true));
        return Ok(new
        {
            Script = script.ToDto(ScriptStatus.Starting),
        });
    }
    
    public override async Task<IActionResult> ListAsync()
    {
        return Ok(new
        {
            Scripts = await Task.WhenAll((await db.Scripts.Where(connection => !connection.IsDeleted).ToArrayAsync()).Select(async script => script.ToDto(await akka.AskAsync<ScriptStatus>(new IScriptingMessage.GetStatus(script.Id))))),
        });
    }
    
    public override async Task<IActionResult> GetAsync([FromRoute] long id)
    {
        if (await db.Scripts.SingleOrDefaultAsync(s => s.Id == id && !s.IsDeleted) is { } script)
        {
            return Ok(script.ToDto(await akka.AskAsync<ScriptStatus>(new IScriptingMessage.GetStatus(id))));
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
            var script = await akka.AskAsync<ScriptEntity>(new IScriptingMessage.Update(id, request.Name, request.Description, request.Code, request.AutoStart));
            return Ok(new
            {
                Script = script.ToDto(await akka.AskAsync<ScriptStatus>(new IScriptingMessage.GetStatus(id))),
            });
        }
        catch (KeyNotFoundException)
        {
            return Error(ErrorCode.NotFound, "Script not found");
        }
    }
    
    public override async Task<IActionResult> DeleteAsync([FromRoute] long id)
    {
        if (await akka.AskAsync<bool>(new IScriptingMessage.Remove(id)))
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
        akka.Tell(new IScriptingMessage.Start(id));
        return Ok(new Success());
    }

    [HttpPost("{id:long}/stop")]
    public IActionResult Stop([FromRoute] long id)
    {
        akka.Tell(new IScriptingMessage.Stop(id));
        return Ok(new Success());
    }

    [HttpPost("{id:long}/restart")]
    public IActionResult Restart([FromRoute] long id)
    {
        akka.Tell(new IScriptingMessage.Restart(id));
        return Ok(new Success());
    }
}