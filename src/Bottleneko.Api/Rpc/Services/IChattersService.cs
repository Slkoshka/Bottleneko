using Bottleneko.Api.Dtos;

namespace Bottleneko.Api.Rpc.Services;

[RpcService(RpcService.Chatters)]
public partial interface IChattersService : IRpcService
{
    Task<ChatterDto[]> ListAsync(IRpcContext context);
    Task<ChatterDto> GetAsync(IRpcContext context, long id);
}
