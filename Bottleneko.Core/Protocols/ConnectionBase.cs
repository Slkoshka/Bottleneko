using Akka.Actor;
using Bottleneko.Api.Protocols;
using Bottleneko.Connections;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Scripting.Bindings;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace Bottleneko.Protocols;

interface IProtocol
{
    abstract static ProtocolDescription GetDescription();
}

public abstract class ConnectionBase : IAsyncDisposable
{
    public event EventHandler? OnConnected;
    public event EventHandler<bool>? OnRestartRequested;
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
    protected void RequestRestart(bool immediate) => OnRestartRequested?.Invoke(this, immediate);
    protected void MessageReceived(ChatMessageEntity entity, ChatMessageBinding binding) => OnMessageReceived?.Invoke(this, (entity, binding));
    protected void Die(Exception exception) => OnDied?.Invoke(this, exception);

    public abstract Task HandleMessageAsync(IActorRef sender, IHandledByConnection message);

    public abstract ValueTask DisposeAsync();
}

public abstract class StaticConnectionBase<TConfig>(StaticConnectionCreationData<TConfig> data) : ConnectionBase
    where TConfig : ProtocolConfiguration
{
    public StaticProtocolContext<TConfig> Context { get; } = data.Context;
    public IActorRef Owner { get; } = data.Owner;
    public long ConnectionId { get; } = data.ConnectionId;
    public IServiceProvider Services { get; } = data.Context.Services;
    public INekoLogger Logger { get; } = data.Context.Logger;
    public TConfig Configuration { get; } = data.Context.Configuration;
}
