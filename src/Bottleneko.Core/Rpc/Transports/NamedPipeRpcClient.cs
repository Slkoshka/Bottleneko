using System.IO.Pipes;
using Bottleneko.Logging;
using Bottleneko.Services;

namespace Bottleneko.Rpc.Transports;

class NamedPipeRpcClient(IServiceProvider services, AkkaService akka, INekoLogger logger, NamedPipeServerStream stream) : SocketLikeRpcClient(services, akka, logger)
{
    protected override async Task<int> ReceiveAsync(Memory<byte> buffer, CancellationToken cancellationToken)
    {
        return await stream.ReadAsync(buffer, cancellationToken);
    }

    protected override async Task<int> SendAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken)
    {
        await stream.WriteAsync(buffer, cancellationToken);
        return buffer.Length;
    }

    protected override void PostStop()
    {
        try
        {
            stream.Close();
        }
        catch (Exception ex)
        {
            Logger.LogWarning("Bottleneko.Rpc", "Failed to close connection", ex);
        }
        stream.Dispose();

        base.PostStop();
    }
}
