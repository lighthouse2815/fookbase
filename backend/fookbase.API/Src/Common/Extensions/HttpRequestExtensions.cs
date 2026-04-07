using InteractHub.Api.Common.Constants;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Common.Extensions;

public static class HttpRequestExtensions
{
    public static string? ExtractAccessToken(this HttpRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var authorizationHeader = request.Headers.Authorization.ToString();
        if (authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authorizationHeader["Bearer ".Length..].Trim();
        }

        if (request.Cookies.TryGetValue(AuthCookieConstants.AccessTokenCookieName, out var cookieToken)
            && !string.IsNullOrWhiteSpace(cookieToken))
        {
            return cookieToken.Trim();
        }

        return null;
    }
}
