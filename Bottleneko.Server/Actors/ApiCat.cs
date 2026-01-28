using Akka.Actor;
using Bottleneko.Actors;
using Bottleneko.Api.Rpc;
using Bottleneko.Database;
using Bottleneko.Logging;
using Bottleneko.Messages;
using Bottleneko.Protocols;
using Bottleneko.Rpc;
using Bottleneko.Server.Rpc;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace Bottleneko.Server.Actors;

record ApiUserData(ClaimsPrincipal? Authentication);

class ApiCat(IServiceProvider services, INekoLogger logger) : NekoActor(services)
{
    public record CreateMessagesSubscription(IActorRef Connection, ChatMessageFilter Filter, SubscriptionId SubscriptionId);
    public record CreateLogSubscription(IActorRef Connection, LogFilter Filter, SubscriptionId SubscriptionId);

    public INekoLogger Logger { get; } = logger;

    private NekoDbContext _db = null!;
    private IOptionsMonitor<JwtBearerOptions> _jwtOptions = null!;
    private readonly RpcServiceCollection _services = new();

    private void RegisterRpcServices(IActorRef self)
    {
        _services.Register(new LoggingRpcService(this, self));
        _services.Register(new MessagesRpcService(self));
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
                    Sender.Tell(new ApiUserData(null));
                }
                else
                {
                    _ = AuthenticateAsync(authenticate.AccessToken).PipeTo(Sender, Self, result => result is null ? new Status.Failure(new Exception("Invalid access token")) : new ApiUserData(result));
                }
                break;

            case CreateMessagesSubscription createMessagesSubscription:
                Sender.Tell(CreateChild<MessagesSubscriptionActor>([createMessagesSubscription.Connection, createMessagesSubscription.Filter, createMessagesSubscription.SubscriptionId, true]));
                break;

            case CreateLogSubscription createLogsSubscription:
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
