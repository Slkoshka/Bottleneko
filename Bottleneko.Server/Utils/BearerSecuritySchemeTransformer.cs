using System.Reflection;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Bottleneko.Server;

class BearerSecuritySchemeTransformer(IAuthenticationSchemeProvider authenticationSchemeProvider) : IOpenApiDocumentTransformer
{
    public async Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        var authenticationSchemes = await authenticationSchemeProvider.GetAllSchemesAsync();
        if (authenticationSchemes.Any(authScheme => authScheme.Name == "Bearer"))
        {
            var requirements = new Dictionary<string, OpenApiSecurityScheme>
            {
                ["Bearer"] = new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer", // "bearer" refers to the header name here
                    In = ParameterLocation.Header,
                    BearerFormat = "Json Web Token"
                }
            };
            
            document.Components ??= new OpenApiComponents();
            document.Components.SecuritySchemes = requirements;

            foreach (var operation in document.Paths.Values.SelectMany(path => path.Operations.Values))
            {
                var action = context.DescriptionGroups.SelectMany(group => group.Items).Single(api => (string)operation.Annotations["x-aspnetcore-id"] == api.ActionDescriptor.Id);

                var requireAuth = false;
                if (action.TryGetMethodInfo(out var methodInfo))
                {
                    var authController = methodInfo.DeclaringType?.GetCustomAttribute<AuthorizeAttribute>() is not null;
                    var anonymousMethod = methodInfo.GetCustomAttribute<AllowAnonymousAttribute>() is not null;
                    var authMethod = methodInfo.GetCustomAttribute<AuthorizeAttribute>() is not null;

                    requireAuth = authMethod || (authController && !anonymousMethod);
                }
                
                if (requireAuth)
                {
                    operation.Security.Add(new OpenApiSecurityRequirement()
                    {
                        [new OpenApiSecurityScheme()
                        {
                            Reference = new OpenApiReference()
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer",
                            },
                        }] = [],
                    });
                }
            }
        }
    }
}