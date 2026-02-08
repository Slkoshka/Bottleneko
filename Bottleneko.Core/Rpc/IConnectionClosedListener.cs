using Bottleneko.Api.Rpc;

namespace Bottleneko.Rpc;

public interface IConnectionClosedListener
{
    void OnConnectionClosed(IRpcContext context);
}
