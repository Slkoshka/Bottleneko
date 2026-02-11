using System.Buffers.Binary;
using Akka.Actor;
using Bottleneko.Api.Rpc;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Services;
using Bottleneko.Utils;

namespace Bottleneko.Rpc.Transports;

abstract class SocketLikeRpcClient(IServiceProvider services, AkkaService akka, INekoLogger logger) : RpcClientBase(services, akka, logger)
{
    record Connected : SingletonMessage<Connected>;
    record EndOfStream : SingletonMessage<EndOfStream>;
    record ConnectionError(Exception Exception);
    record PacketSent : SingletonMessage<PacketSent>;

    private readonly CancellationTokenSource _cts = new();
    private readonly byte[] _sendLengthBuffer = new byte[sizeof(uint)];
    private readonly byte[] _receiveBuffer = new byte[4096];
    private readonly MemoryStream _receiveStream = new();
    private bool _isSending = false;
 
    public override Task InitAsync(IActorRef self)
    {
        Read(self);
        self.Tell(Connected.Instance);
        return Task.CompletedTask;
    }

    protected abstract Task<int> ReceiveAsync(Memory<byte> buffer, CancellationToken cancellationToken);
    protected abstract Task<int> SendAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken);

    private async Task<bool> ReceiveExactlyAsync(Memory<byte> buffer, CancellationToken cancellationToken)
    {
        var total = 0;
        while (total < buffer.Length)
        {
            var read = await ReceiveAsync(buffer[total..], cancellationToken);
            if (read == 0)
            {
                return false;
            }
            
            total += read;
        }
        return true;
    }

    private async Task<bool> ReceiveExactlyAsync(Stream stream, int count, CancellationToken cancellationToken)
    {
        var total = 0;
        while (total < count)
        {
            var read = await ReceiveAsync(_receiveBuffer.AsMemory(0, Math.Min(_receiveBuffer.Length, count - total)), cancellationToken);
            if (read == 0)
            {
                return false;
            }
            await stream.WriteAsync(_receiveBuffer.AsMemory(0, read), cancellationToken);
            total += read;
        }
        return true;
    }

    private async Task<Packet?> ReceiveAsync(CancellationToken cancellationToken)
    {
        if (!await ReceiveExactlyAsync(_receiveBuffer.AsMemory(0, sizeof(uint)), cancellationToken))
        {
            return null;
        }

        var size = BinaryPrimitives.ReadUInt32LittleEndian(_receiveBuffer);
        if (size > int.MaxValue)
        {
            throw new Exception("Invalid packet header");
        }

        _receiveStream.Seek(0, SeekOrigin.Begin);
        _receiveStream.SetLength(0);
        if (!await ReceiveExactlyAsync(_receiveStream, (int)size, cancellationToken))
        {
            return null;
        }

        _receiveStream.Seek(0, SeekOrigin.Begin);
        if (RpcProtocol.Deserialize(_receiveStream) is { } packet)
        {
            return packet;
        }
        else
        {
            throw new Exception("Null packet");
        }
    }

    private async Task<bool> SendAsync(Packet packet, CancellationToken cancellationToken)
    {
        var buffer = RpcProtocol.Serialize(packet);
        if (buffer.Length > int.MaxValue)
        {
            throw new Exception("Invalid packet header");
        }
        BinaryPrimitives.WriteUInt32LittleEndian(_sendLengthBuffer, (uint)buffer.Length);

        var total = 0;
        while (total < sizeof(uint))
        {
            var sent = await SendAsync(_sendLengthBuffer.AsMemory(total), cancellationToken);
            if (sent == 0)
            {
                return false;
            }
            total += sent;
        }

        total = 0;
        while (total < buffer.Length)
        {
            var sent = await SendAsync(buffer.AsMemory(total), cancellationToken);
            if (sent == 0)
            {
                return false;
            }
            total += sent;
        }

        return true;
    }

    private void Read(IActorRef self)
    {
        _ = ReceiveAsync(_cts.Token).PipeTo(self, self, packet => packet is null ? EndOfStream.Instance : new RpcMessages.PacketReceived(packet), ex => ex is OperationCanceledException ? null : new ConnectionError(ex));
    }

    protected override void Send(Packet packet)
    {
        Self.Tell(new RpcMessages.SendPacket(packet));
    }

    protected override void Error(string message)
    {
        Self.Tell(new ConnectionError(new Exception(message)));
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case Connected:
                OnConnected();
                break;

            case RpcMessages.PacketReceived packetReceived:
                OnPacketReceived(packetReceived.Packet);
                Read(Self);
                break;

            case RpcMessages.SendPacket sendPacket:
                if (_isSending)
                {
                    Stash.Stash();
                }
                else
                {
                    _isSending = true;
                    _ = SendAsync(sendPacket.Packet, _cts.Token).PipeTo(Self, Self, result => result ? PacketSent.Instance : EndOfStream.Instance, ex => ex is OperationCanceledException ? null : new ConnectionError(ex));
                }
                break;

            case PacketSent:
                _isSending = false;
                Stash.Unstash();
                break;

            case EndOfStream:
                OnDisconnected();
                Context.Stop(Self);
                break;

            case ConnectionError connectionError:
                Logger.LogWarning("Bottleneko.Rpc", "Connection error", connectionError.Exception);
                Context.Stop(Self);
                break;

            case ControlMessages.Shutdown:
                Context.Stop(Self);
                break;

            default:
                if (!CustomMessageHandler(message))
                {
                    Unhandled(message);
                }
                break;
        }
    }
}
