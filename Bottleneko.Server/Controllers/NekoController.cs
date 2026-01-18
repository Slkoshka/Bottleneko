using Bottleneko.Server.Utils;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;

namespace Bottleneko.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NekoController : ControllerBase
{
    public enum ErrorCode
    {
        Unauthorized = 401,
        NotFound = 404,
        InternalError = 500,
        ConnectionError = 1000,
        DuplicateName = 1001,
        Timeout = 1002,
        InvalidOperation = 1003,
        SetupRequired = 1004,
        InvalidValue = 1005,
    }

    public record Success();
    public record ErrorResponse([property: JsonConverter(typeof(SerializePropertyAsDefaultConverter<ErrorCode>))] ErrorCode Code, string Description, object? Extra = null);

    protected IActionResult Error(ErrorCode code, string description, object? extra = null)
    {
        return (int)code switch
        {
            >= 400 and <= 599 => StatusCode((int)code, new ErrorResponse(code, description, extra)),
            _ => BadRequest(new ErrorResponse(code, description, extra)),
        };
    }
}
