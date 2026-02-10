using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Rpc;
using Bottleneko.Messages;
using Bottleneko.Rpc;
using Bottleneko.Services;
using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;

namespace Bottleneko.Server.Controllers;

public class WebSocketController(AkkaService akka) : NekoController
{
    private readonly byte[] _receiveBuffer = new byte[65536];

    private async Task<Packet?> ReceiveAsync(WebSocket ws, CancellationToken cancellationToken)
    {
        var result = await ws.ReceiveAsync(_receiveBuffer, cancellationToken);

        if (!result.EndOfMessage)
        {
            await ws.CloseAsync(WebSocketCloseStatus.MessageTooBig, "The message is too big", cancellationToken);
            return null;
        }

        switch (result.MessageType)
        {
            case WebSocketMessageType.Text:
                return result.CloseStatus.HasValue ? null : RpcProtocol.Deserialize(_receiveBuffer.AsSpan(0, result.Count));

            case WebSocketMessageType.Binary:
                await ws.CloseAsync(WebSocketCloseStatus.InvalidMessageType, "Binary messages are not supported", cancellationToken);
                return null;

            case WebSocketMessageType.Close:
                return null;

            default:
                throw new InvalidOperationException("Unexpected message type");
        }
    }

    private async Task SendAsync(WebSocket ws, Packet packet, CancellationToken cancellationToken)
    {
        await ws.SendAsync(RpcProtocol.Serialize(packet), WebSocketMessageType.Text, true, cancellationToken);
    }

    public async Task HandleConnectionAsync(WebSocket ws, CancellationToken cancellationToken)
    {
        var adapter = await akka.AskAsync(new RpcMessages.CreateRpcAdapter((packet) => SendAsync(ws, packet, cancellationToken)).ToRpc().WithReply<IActorRef>());

        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                if (ws.State != WebSocketState.Open)
                {
                    break;
                }

                if (await ReceiveAsync(ws, cancellationToken) is { } packet)
                {
                    adapter.Tell(new RpcMessages.PacketReceived(packet));
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
        finally
        {
            adapter.Tell(ControlMessages.Shutdown.Instance);
        }
    }

    [Route("/ws")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task GetAsync(CancellationToken cancellationToken)
    {
        if (HttpContext.WebSockets.IsWebSocketRequest)
        {
            try
            {
                await HandleConnectionAsync(await HttpContext.WebSockets.AcceptWebSocketAsync(), cancellationToken);
            }
            catch (Exception ex) when (ex is ConnectionAbortedException or WebSocketException { WebSocketErrorCode: WebSocketError.ConnectionClosedPrematurely })
            {
                // This isn't strictly an error, so let's not pollute the log with scary error messages
            }
        }
        else
        {
            HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        }
    }
}
