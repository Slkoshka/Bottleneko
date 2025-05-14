using Akka.Actor;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Messages;
using Bottleneko.Scripting.Bindings;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace Bottleneko.Protocols;

abstract class ConnectionBase : IAsyncDisposable
{
    public event EventHandler? OnConnected;
    public event EventHandler? OnRestartRequested;
    public event EventHandler<(ChatMessageEntity Entity, ChatMessageBinding Binding)>? OnMessageReceived;
    public event EventHandler<Exception>? OnDied;

    public abstract Task StartAsync();

    protected static async Task<IWebProxy?> GetProxyAsync(string? id)
    {
        await using var db = NekoDbContext.Get();
        var proxyId = string.IsNullOrEmpty(id) ? (long?)null : long.Parse(id);
        return id is null ? null : (await db.Proxies.SingleOrDefaultAsync(proxy => proxy.Id == proxyId && !proxy.IsDeleted))?.CreateProxy();
    }

    protected void Connected() => OnConnected?.Invoke(this, EventArgs.Empty);
    protected void RequestRestart() => OnRestartRequested?.Invoke(this, EventArgs.Empty);
    protected void MessageReceived(ChatMessageEntity entity, ChatMessageBinding binding) => OnMessageReceived?.Invoke(this, (entity, binding));
    protected void Die(Exception exception) => OnDied?.Invoke(this, exception);

    public abstract Task HandleMessageAsync(IActorRef sender, IConnectionsMessage message);

    public abstract ValueTask DisposeAsync();
}
