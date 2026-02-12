using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Bottleneko.Server.Utils;

class FixServerURLSchemeTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        document.Servers = [new OpenApiServer { Url = "/" }];
        return Task.CompletedTask;
    }
}