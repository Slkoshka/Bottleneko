using Bottleneko.Api.Dtos;
using Bottleneko.Api.Protocols;

namespace Bottleneko.Api.Rpc.Services;

[RpcService(RpcService.Connections)]
public partial interface IConnectionsService : IRpcService
{
    Task<ConnectionDto[]> ListAsync(IRpcContext context);
    Task<ConnectionDto> GetAsync(IRpcContext context, long id);
    Task<ConnectionDto> UpdateAsync(IRpcContext context, long id, string? name, ProtocolConfiguration? config, bool? autoStart);
    Task DeleteAsync(IRpcContext context, long id);
    Task<ConnectionDto> AddAsync(IRpcContext context, string name, Protocol protocol, ProtocolConfiguration config);
    Task<string> GetAttachmentUrlAsync(IRpcContext context, long id, long attachmentId);

    void Start(IRpcContext context, long id);
    void Restart(IRpcContext context, long id);
    void Stop(IRpcContext context, long id);

    public record ConnectionTestResult(TimeSpan Duration, object? Extra);
    Task<ConnectionTestResult> TestAsync(IRpcContext context, Protocol protocol, ProtocolConfiguration config);
}
