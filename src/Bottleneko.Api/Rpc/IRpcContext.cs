namespace Bottleneko.Api.Rpc;

public enum RpcCallerRole
{
    Script,
    User,
    Anonymous,
}

public interface IRpcContext
{
    RpcCallerRole CallerRole { get; }
    void RequireRole(params Span<RpcCallerRole> roles);
}
