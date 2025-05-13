using Bottleneko.Database;
using Bottleneko.Database.Options;
using Bottleneko.Logging;
using Bottleneko.Protocols;
using Bottleneko.Server.Controllers;
using Bottleneko.Server.Controllers.WebSockets;
using Bottleneko.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.IdentityModel.Tokens;
using System.Data;
using System.Text.Json.Serialization;

namespace Bottleneko.Server;

public class BottlenekoServer : IAsyncDisposable
{
    public int ExitCode { get; set; }

    private WebApplication? _app;

    private static async Task BlockUntilSetupMiddlewareAsync(HttpContext context, RequestDelegate next)
    {
        var metadata = context.Features.GetRequiredFeature<IEndpointFeature>().Endpoint?.Metadata;
        var action = metadata?.GetMetadata<ControllerActionDescriptor>();

        if (NekoOptions.GetOptionOrDefault<OptionSetUp>().IsSetUp || action is null || !action.ControllerTypeInfo.IsAssignableTo(typeof(NekoController)) || action.MethodInfo == typeof(SystemController).GetMethod(nameof(SystemController.SetupAsync)))
        {
            await next(context);
        }
        else
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new NekoController.ErrorResponse(NekoController.ErrorCode.SetupRequired, "Server has not been set up"));
        }
    }

    private void HandleExceptionsMiddleware(IApplicationBuilder exceptionHandlerApp)
    {
        var logger = exceptionHandlerApp.ApplicationServices.GetRequiredService<ILoggerFactory>().CreateLogger("Bottleneko");

        exceptionHandlerApp.Run(async context =>
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            if (context.Features.Get<IExceptionHandlerFeature>() is { } errorFeature)
            {
                switch (errorFeature.Error)
                {
                    case DuplicateNameException:
                        context.Response.StatusCode = StatusCodes.Status400BadRequest;
                        await context.Response.WriteAsJsonAsync(new NekoController.ErrorResponse(NekoController.ErrorCode.DuplicateName, errorFeature.Error.Message));
                        break;

                    case KeyNotFoundException:
                        context.Response.StatusCode = StatusCodes.Status404NotFound;
                        await context.Response.WriteAsJsonAsync(new NekoController.ErrorResponse(NekoController.ErrorCode.NotFound, errorFeature.Error.Message));
                        break;

                    default:
                        logger.LogError(StatusCodes.Status500InternalServerError, errorFeature.Error, "An unhandled exception has occured: {Exception}", errorFeature.Error.Message);
                        await context.Response.WriteAsJsonAsync(new NekoController.ErrorResponse(NekoController.ErrorCode.InternalError, errorFeature.Error.Message));
                        break;
                }
            }
            else
            {
                logger.LogError(StatusCodes.Status500InternalServerError, "An unknown error has occured");
                await context.Response.WriteAsJsonAsync(new NekoController.ErrorResponse(NekoController.ErrorCode.InternalError, "Unknown error"));
            }
        });
    }

    private WebApplication Build(ILoggerProvider logProvider, string dbFile, string[] bindAddresses)
    {
        var builder = WebApplication.CreateBuilder();
        builder.Logging.AddProvider(logProvider);
        builder.Configuration.AddJsonFile("appsettings.json");
        builder.Configuration.AddEnvironmentVariables("neko");
        builder.AddServiceDefaults();

        if (bindAddresses.Length > 0)
        {
            builder.WebHost.UseUrls(bindAddresses);
        }

        builder.Services.Configure<JsonOptions>(options =>
        {
            options.JsonSerializerOptions.AllowOutOfOrderMetadataProperties = true;
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                using var db = NekoDbContext.Get();
                options.RequireHttpsMetadata = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    IssuerSigningKey = new SymmetricSecurityKey(NekoOptions.GetRequiredOption<OptionSecretKey>().Key),
                };
                options.Events = new JwtBearerEvents()
                {
                    OnMessageReceived = (ctx) =>
                    {
                        if (ctx.HttpContext.Request.Method == "GET" && ctx.HttpContext.Request.Query.TryGetValue("download", out var isDownload) && isDownload == "1" && ctx.HttpContext.Request.Cookies.TryGetValue("neko_access_token", out var token))
                        {
                            ctx.Token = token;
                        }
                        return Task.CompletedTask;
                    },
                    OnTokenValidated = (ctx) =>
                    {
                        var authHeader = ctx.Request.Headers.Authorization.SingleOrDefault();
                        if (!string.IsNullOrEmpty(authHeader) && authHeader.Length > "Bearer ".Length)
                        {
                            ctx.Response.Cookies.Append("neko_access_token", string.IsNullOrEmpty(authHeader) ? "" : authHeader["Bearer ".Length..], new CookieOptions()
                            {
                                HttpOnly = true,
                                Secure = false,
                                SameSite = SameSiteMode.Strict,
                                Path = "/",
                                MaxAge = TimeSpan.FromDays(30),
                            });
                        }
                        return Task.CompletedTask;
                    },
                };
            });

        builder.Services.AddScoped<WebSocketHandler>();
        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer<FixServerURLSchemeTransformer>();
            options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
        });

        builder.Services.AddSingleton(new NekoSettings()
        {
            DatabasePath = dbFile,
        });
        builder.Services.AddSingleton<INekoLogger>(provider => new LogRouter(LogSourceType.System, "System"));

        builder.Services.AddSingleton<ProtocolRegistry>();
        builder.Services.AddScoped(_ => NekoDbContext.Get());
        builder.Services.AddSingleton<AkkaService>();
        builder.Services.AddHostedService(services => services.GetRequiredService<AkkaService>());

        builder.Services.AddSingleton(this);

        return builder.Build();
    }

    private WebApplication SetupApplication(string dbFile, string[] bindAddresses)
    {
        var nekoLogProvider = new NekoLogProvider();
        var app = Build(nekoLogProvider, dbFile, bindAddresses);

        nekoLogProvider.Logger = app.Services.GetService<INekoLogger>();

        NekoDbContext.Initialize(app.Services.GetRequiredService<INekoLogger>(), dbFile);
        NekoOptions.Initialize();

        app.UseExceptionHandler(HandleExceptionsMiddleware);
        app.Use(BlockUntilSetupMiddlewareAsync);
        app.UseDefaultFiles();
        app.UseStaticFiles();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "Bottleneko API"));
        }

        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        app.MapFallbackToFile("/index.html");
        app.MapDefaultEndpoints();

        app.UseWebSockets(new WebSocketOptions()
        {
            KeepAliveInterval = TimeSpan.FromSeconds(60),
            KeepAliveTimeout = TimeSpan.FromSeconds(120),
        });

        return app;
    }

    public async Task<int> StartAsync(string dbFile, string[] bindAddresses, CancellationToken cancellationToken = default)
    {
        _app = SetupApplication(dbFile, bindAddresses);
        await _app.RunAsync();
        return ExitCode;
    }

    public async Task StopAsync()
    {
        if (_app is not null)
        {
            await _app.StopAsync();
        }
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);

        if (_app is not null)
        {
            await _app.DisposeAsync();
        }
    }
}
