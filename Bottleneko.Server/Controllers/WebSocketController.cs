using Bottleneko.Server.Controllers.WebSockets;
using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;

namespace Bottleneko.Server.Controllers;

public class WebSocketController(WebSocketHandler wsHandler) : NekoController
{
    [Route("/ws")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task GetAsync(CancellationToken cancellationToken)
    {
        if (HttpContext.WebSockets.IsWebSocketRequest)
        {
            try
            {
                await wsHandler.HandleConnectionAsync(await HttpContext.WebSockets.AcceptWebSocketAsync(), cancellationToken);
            }
            catch (WebSocketException ex) when (ex.WebSocketErrorCode == WebSocketError.ConnectionClosedPrematurely)
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
