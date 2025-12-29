using Bottleneko.Api.Dtos;
using Bottleneko.Utils;

namespace Bottleneko.Messages;

public static class ScriptingMessages
{
    public record Add(string Name, string Description, ScriptCode Code, bool AutoStart) : ContainerMessages.Add;
    public record Update(long Id, string? Name, string? Description, ScriptCode? Code, bool? AutoStart) : ContainerMessages.Update(Id);
    public record Remove(long Id) : ContainerMessages.Remove(Id);

    public record GetStatus() : SingletonMessage<GetStatus>;
}
