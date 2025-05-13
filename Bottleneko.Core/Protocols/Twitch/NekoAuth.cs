using TwitchLib.Api.Auth;
using TwitchLib.Api.Core.Enums;
using TwitchLib.Api.Core.Exceptions;
using TwitchLib.Api.Core.Interfaces;

namespace Bottleneko.Protocols.Twitch;

class NekoAuth(IApiSettings settings, IRateLimiter? rateLimiter, IHttpCallHandler? http) : Auth(settings, rateLimiter, http)
{
    public new Task<RefreshResponse> RefreshAuthTokenAsync(string refreshToken, string? clientSecret = null, string? clientId = null)
    {
        clientId ??= Settings.ClientId;

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new BadParameterException("The refresh token is not valid. It is not allowed to be null, empty or filled with whitespaces.");
        }

        if (string.IsNullOrWhiteSpace(clientId))
        {
            throw new BadParameterException("The clientId is not valid. It is not allowed to be null, empty or filled with whitespaces.");
        }

        List<KeyValuePair<string, string>> @params =
        [
            new KeyValuePair<string, string>("grant_type", "refresh_token"),
            new KeyValuePair<string, string>("refresh_token", refreshToken),
            new KeyValuePair<string, string>("client_id", clientId),
        ];

        if (clientSecret is not null)
        {
            @params.Add(new KeyValuePair<string, string>("client_secret", clientSecret));
        }

        return TwitchPostGenericAsync<RefreshResponse>("/token", ApiVersion.Auth, null, @params, null, clientId);
    }
}
