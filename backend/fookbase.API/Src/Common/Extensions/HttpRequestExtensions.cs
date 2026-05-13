using InteractHub.Api.Common.Constants;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Common.Extensions;

public static class HttpRequestExtensions
{
    public static string? ExtractAccessToken(this HttpRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var tokenFromAuthorization = request.Headers.Authorization.ToString().NormalizeAccessTokenOrNull();
        if (!string.IsNullOrWhiteSpace(tokenFromAuthorization))
        {
            return tokenFromAuthorization;
        }

        if (request.Cookies.TryGetValue(AuthCookieConstants.AccessTokenCookieName, out var cookieToken)
            && !string.IsNullOrWhiteSpace(cookieToken))
        {
            return cookieToken.NormalizeAccessTokenOrNull();
        }

        return null;
    }
}



