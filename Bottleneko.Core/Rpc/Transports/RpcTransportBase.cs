using Bottleneko.Actors;
using Bottleneko.Messages;

namespace Bottleneko.Rpc.Transports;

abstract class RpcTransportBase(IServiceProvider services) : NekoActor(services)
{
    protected abstract void Shutdown();

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case ControlMessages.Shutdown:
                Shutdown();
                break;

            default:
                Unhandled(message);
                break;
        }
    }
}
