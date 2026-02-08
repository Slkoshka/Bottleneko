using Bottleneko.Api.Rpc;
using Microsoft.AspNetCore.Mvc;

namespace Bottleneko.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NekoController : ControllerBase
{
    public record Success();

    protected IActionResult Error(ErrorCode code, string description, object? extra = null)
    {
        return (int)code switch
        {
            >= 400 and <= 599 => StatusCode((int)code, new ErrorResult(code, description, extra)),
            >= 1000 and <= 1999 => BadRequest(new ErrorResult(code, description, extra)),
            _ => StatusCode(StatusCodes.Status500InternalServerError, new ErrorResult(code, description, extra)),
        };
    }
}
