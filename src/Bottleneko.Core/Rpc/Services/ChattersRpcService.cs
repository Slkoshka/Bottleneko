using Bottleneko.Api.Dtos;
using Bottleneko.Api.Rpc;
using Bottleneko.Api.Rpc.Services;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Microsoft.EntityFrameworkCore;

namespace Bottleneko.Rpc.Services;

public class ChattersRpcService : IChattersService
{
    public async Task<ChatterDto> GetAsync(IRpcContext context, long id)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
            {
                using var db = NekoDbContext.Get();
                if (await db.Chatters.SingleOrDefaultAsync(chatter => chatter.Id == id) is ChatterEntity chatter)
                {
                    return chatter.ToDto();
                }
                else
                {
                    throw new Exception("Chatter not found");
                }
            }
        }
    }

    public async Task<ChatterDto[]> ListAsync(IRpcContext context)
    {
        switch (context)
        {
            case not RpcContext: throw new RpcUnsupportedException();
            case { CallerRole: RpcCallerRole.Anonymous }: throw new RpcAuthenticationRequiredException();

            case RpcContext:
            {
                using var db = NekoDbContext.Get();
                return [.. (await db.Chatters.ToArrayAsync()).Select(chatter => chatter.ToDto())];
            }
        }
    }
}
