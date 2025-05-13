using Microsoft.Extensions.Logging;
using TwitchLib.Api;
using TwitchLib.Api.Core;
using TwitchLib.Api.Core.HttpCallHandlers;
using TwitchLib.Api.Core.Interfaces;
using TwitchLib.Api.Core.RateLimiter;

namespace Bottleneko.Protocols.Twitch;

class TwitchAPIWrapper(ILoggerFactory? loggerFactory, IRateLimiter rateLimiter, IApiSettings settings, IHttpCallHandler http) : TwitchAPI(loggerFactory, rateLimiter, settings, http)
{
    protected readonly IRateLimiter _rateLimiter = rateLimiter;
    protected readonly IApiSettings _settings = settings;
    protected readonly IHttpCallHandler _http = http;
}

class NekoTwitchAPI : TwitchAPIWrapper
{
    public new NekoAuth Auth { get; }

    public NekoTwitchAPI(ILoggerFactory? loggerFactory = null, IRateLimiter? rateLimiter = null, IApiSettings? settings = null, IHttpCallHandler? http = null) :
        base(loggerFactory, rateLimiter ?? BypassLimiter.CreateLimiterBypassInstance(), settings ?? new ApiSettings(), http ?? new TwitchHttpClient(loggerFactory?.CreateLogger<TwitchHttpClient>()))
    {
        Auth = new NekoAuth(_settings, _rateLimiter, _http);
    }
}
