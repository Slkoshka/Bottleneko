using System.Security.Claims;
using Bottleneko.Api.Rpc;
using Bottleneko.Rpc;
using Bottleneko.Server.Actors;

static class RpcExtensions
{
    extension(RpcContext context)
    {
        public bool IsAnonymous => context.Authentication is null;
        public ClaimsPrincipal? Authentication => context is ApiRpcContext { UserData: ApiUserData { Authentication: var authentication } } ? authentication : null;

        public void RequireAuthentication()
        {
            if (context.IsAnonymous)
            {
                throw new Exception("Unauthorized");
            }
        }
    }
}
