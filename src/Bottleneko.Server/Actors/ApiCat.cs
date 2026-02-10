using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Database;
using Bottleneko.Database.Schema;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Protocols;
using Bottleneko.Rpc;
using Bottleneko.Rpc.Services;
using Bottleneko.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace Bottleneko.Server.Actors;

class ApiCat(IServiceProvider services, INekoLogger logger, AkkaService akka) : NekoActor(services)
{
    public INekoLogger Logger { get; } = logger;

    private NekoDbContext _db = null!;
    private IOptionsMonitor<JwtBearerOptions> _jwtOptions = null!;
    private readonly RpcServiceCollection _services = new();

    private void RegisterRpcServices(IActorRef self)
    {
        _services.Register(new LoggingRpcService(Logger, self));
        _services.Register(new MessagesRpcService(akka, self));
        _services.Register(new ConnectionsRpcService(Services, Logger, akka));
        _services.Register(new ChattersRpcService());
    }

    public override Task InitAsync(IActorRef self)
    {
        _db = Services.GetRequiredService<NekoDbContext>();
        _jwtOptions = Services.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();

        RegisterRpcServices(self);

        return Task.CompletedTask;
    }

    private async Task<ClaimsPrincipal?> AuthenticateAsync(string accessToken)
    {
        var identities = new List<ClaimsIdentity>();
        var options = _jwtOptions.Get(JwtBearerDefaults.AuthenticationScheme);
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

    private static async Task<UserEntity?> GetUserAsync(ClaimsPrincipal? claims)
    {
        if (claims is null || claims.Identity?.Name is null)
        {
            return null;
        }

        using var db =  NekoDbContext.Get();
        return await db.Users.SingleOrDefaultAsync(u => u.Id.ToString() == claims.Identity.Name && !u.IsDeleted);
    }

    private async Task<UserEntity?> AuthenticateUserAsync(string accessToken)
    {
        return await GetUserAsync(await AuthenticateAsync(accessToken));
    }

    public async Task<ClaimsIdentity?> GetIdentityAsync(string login, string password)
    {
        login = login.Trim().ToLowerInvariant();

        var user = await _db.Users.SingleOrDefaultAsync(user => user.Login == login && !user.IsDeleted);
        if (user is null || !user.CheckPassword(password))
        {
            return null;
        }

        return new ClaimsIdentity([
            new Claim(ClaimsIdentity.DefaultNameClaimType, user.Id.ToString()),
            new Claim(ClaimsIdentity.DefaultRoleClaimType, user.Role.ToString()),
        ], "Token", ClaimsIdentity.DefaultNameClaimType, ClaimsIdentity.DefaultRoleClaimType);
    }

    protected override void OnMessage(object message)
    {
        switch (message)
        {
            case ApiMessages.Authenticate authenticate:
                if (authenticate.AccessToken == "anonymous")
                {
                    Sender.Tell(new ApiMessages.AuthenticationResult(null));
                }
                else
                {
                    _ = AuthenticateUserAsync(authenticate.AccessToken).PipeTo(Sender, Self, result => result is null ? new Status.Failure(new Exception("Invalid access token")) : new ApiMessages.AuthenticationResult(result));
                }
                break;

            case RpcMessages.CreateMessagesSubscription createMessagesSubscription:
                Sender.Tell(CreateChild<MessagesSubscriptionActor>([createMessagesSubscription.Connection, createMessagesSubscription.Filter, createMessagesSubscription.SubscriptionId, true]));
                break;

            case RpcMessages.CreateLogSubscription createLogsSubscription:
                Sender.Tell(CreateChild<LogSubscriptionActor>([createLogsSubscription.Connection, createLogsSubscription.Filter, createLogsSubscription.SubscriptionId, true]));
                break;

            case RpcMessages.HandleRequest handleRequest:
                _ = _services.HandleRequestAsync(handleRequest.Context, handleRequest.Request).PipeTo(Sender, Self);
                break;

            case ControlMessages.Shutdown:
                Context.Stop(Self);
                break;

            default:
                Unhandled(message);
                break;
        }
    }
}
