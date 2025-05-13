using System.Net.WebSockets;
using System.Security.Claims;
using Bottleneko.Api.Packets;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace Bottleneko.Server.Controllers.WebSockets;

public class WebSocketHandler(IServiceProvider services, IOptions<JsonOptions> jsonOptions, IOptionsMonitor<JwtBearerOptions> jwtOptions)
{
    private readonly byte[] _receiveBuffer = new byte[65536];
    private readonly Dictionary<string, Subscription> _subscriptions = [];
    
    private async Task<Packet?> ReceiveAsync(WebSocket ws, CancellationToken cancellationToken)
    {
        var result = await ws.ReceiveAsync(_receiveBuffer, cancellationToken);
        
        if (!result.EndOfMessage)
        {
            await ws.CloseAsync(WebSocketCloseStatus.MessageTooBig, "Message too big", cancellationToken);
            return null;
        }

        switch (result.MessageType)
        {
            case WebSocketMessageType.Text:
                return result.CloseStatus.HasValue ? null : JsonSerializer.Deserialize<Packet>(_receiveBuffer.AsSpan(0, result.Count), jsonOptions.Value.JsonSerializerOptions);
            
            case WebSocketMessageType.Binary:
                await ws.CloseAsync(WebSocketCloseStatus.InvalidMessageType, "Binary messages are not supported", cancellationToken);
                return null;
            
            case WebSocketMessageType.Close:
                return null;
            
            default:
                throw new InvalidOperationException("Unexpected WebSocketMessageType");
        }
    }

    public async Task SendAsync(WebSocket ws, Packet packet, CancellationToken cancellationToken)
    {
        await ws.SendAsync(JsonSerializer.SerializeToUtf8Bytes(packet, jsonOptions.Value.JsonSerializerOptions), WebSocketMessageType.Text, true, cancellationToken);
    }

    private async Task<ClaimsPrincipal?> AuthenticateAsync(string accessToken)
    {
        var identities = new List<ClaimsIdentity>();
        var options = jwtOptions.Get(JwtBearerDefaults.AuthenticationScheme);
        foreach (var handler in options.TokenHandlers)
        {
            var token = handler.ReadToken(accessToken);
            var result = await handler.ValidateTokenAsync(token, options.TokenValidationParameters);
            if (result.IsValid)
            {
                identities.Add(result.ClaimsIdentity);
            }
        }
        
        return new ClaimsPrincipal([.. identities]);
    }

    public async Task HandleConnectionAsync(WebSocket ws, CancellationToken cancellationToken)
    {
        {
            using var authTimeoutCts = new CancellationTokenSource();
            authTimeoutCts.CancelAfter(TimeSpan.FromSeconds(3));
            using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, authTimeoutCts.Token);
            var firstPacket = await ReceiveAsync(ws, combinedCts.Token);
            if (firstPacket is AuthenticatePacket authPacket)
            {
                var user = await AuthenticateAsync(authPacket.AccessToken);
                if (user?.Identity is null)
                {
                    await ws.CloseAsync(WebSocketCloseStatus.PolicyViolation, "Authentication failed", cancellationToken);
                    return;
                }
            }
            else
            {
                await ws.CloseAsync(WebSocketCloseStatus.InvalidMessageType, "Authentication message required", cancellationToken);
                return;
            }
        }

        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                switch (await ReceiveAsync(ws, cancellationToken))
                {
                    case SubscribePacket subscribe:
                        if (_subscriptions.ContainsKey(subscribe.Id))
                        {
                            break;
                        }

                        switch (subscribe.Topic)
                        {
                            case LogsSubscriptionTopic logTopic:
                                _subscriptions[subscribe.Id] = new LogSubscription(services, logTopic, subscribe.Id, this, ws);
                                break;

                            case ChatMessagesSubscriptionTopic messagesTopic:
                                _subscriptions[subscribe.Id] = new MessageSubscription(services, messagesTopic, subscribe.Id, this, ws);
                                break;

                            default:
                                await ws.CloseAsync(WebSocketCloseStatus.InvalidMessageType, "Invalid subscription", cancellationToken);
                                return;
                        }

                        _ = _subscriptions[subscribe.Id].SendMessagesAsync();
                        break;

                    case UnsubscribePacket unsubscribe:
                        if (_subscriptions.TryGetValue(unsubscribe.Id, out var subscription))
                        {
                            await subscription.DisposeAsync();
                            _subscriptions.Remove(unsubscribe.Id);
                        }

                        break;

                    case null:
                        if (ws.State == WebSocketState.Open)
                        {
                            await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, null, cancellationToken);
                        }

                        return;

                    default:
                        await ws.CloseAsync(WebSocketCloseStatus.InvalidMessageType, "Unknown packet", cancellationToken);
                        return;
                }
            }
        }
        finally
        {
            await Task.WhenAll(_subscriptions.Values.Select(v => v.DisposeAsync().AsTask()));
        }
    }
}