using System.Net.WebSockets;
using Bottleneko.Api.Packets;

namespace Bottleneko.Server.Controllers.WebSockets;

public abstract class Subscription(string subscriptionId, WebSocketHandler wsHandler, WebSocket ws) : IAsyncDisposable
{
    private readonly Lock _lock = new();
    private bool _sending = false;
    private bool _sendAgain = false;
    private readonly CancellationTokenSource _cts = new();

    protected abstract IAsyncEnumerable<Letter[]> GetNewMessagesAsync(CancellationToken cancellationToken);

    public async Task SendMessagesAsync()
    {
        lock (_lock)
        {
            if (_sending)
            {
                _sendAgain = true;
                return;
            }
            _sending = true;
        }
        try
        {
            var send = true;
            while (send)
            {
                await Task.Delay(TimeSpan.FromMilliseconds(250), _cts.Token);

                await foreach (var mail in GetNewMessagesAsync(_cts.Token))
                {
                    await wsHandler.SendAsync(ws, new MailPacket(subscriptionId, mail), _cts.Token);
                }

                lock (_lock)
                {
                    send = _sendAgain;
                    _sendAgain = false;
                }
            }
        }
        catch (ObjectDisposedException)
        {
            return;
        }
        catch (OperationCanceledException)
        {
            return;
        }
        finally
        {
            lock(_lock)
            {
                _sending = false;
            }
        }
    }

    public virtual async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        await _cts.CancelAsync();
        _cts.Dispose();
    }
}
