using Bottleneko.Api.Dtos;

namespace Bottleneko.Messages;

public interface IScriptingMessage : IContainerMessage
{
    public new record Add(string Name, string Description, ScriptCode Code, bool AutoStart) : IContainerMessage.Add, IScriptingMessage;
    public new record Update(long Id, string? Name, string? Description, ScriptCode? Code, bool? AutoStart) : IContainerMessage.Update(Id), IScriptingMessage;
    public new record Remove(long Id) : IContainerMessage.Remove(Id), IScriptingMessage;
    public new record Start(long Id) : IContainerMessage.Start(Id), IScriptingMessage;
    public new record Restart(long Id) : IContainerMessage.Restart(Id), IScriptingMessage;
    public new record Stop(long Id) : IContainerMessage.Stop(Id), IScriptingMessage;
    public record GetStatus(long Id) : IScriptingMessage, IHasReply;
}
