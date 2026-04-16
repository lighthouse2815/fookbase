using System.IdentityModel.Tokens.Jwt;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Infrastructure.Services;

public class AuthCookieService : IAuthCookieService
{
    public void SetLoginCookies(HttpContext context, string token)
    {
        ArgumentNullException.ThrowIfNull(context);

        var normalizedToken = token.NormalizeAccessToken();
        if (string.IsNullOrWhiteSpace(normalizedToken))
        {
            return;
        }

        var tokenCookieOptions = CreateAuthCookieOptions(context);
        var expiration = TryReadJwtExpiration(normalizedToken);

        if (expiration.HasValue)
        {
            tokenCookieOptions.Expires = expiration.Value;
        }

        context.Response.Cookies.Append(
            AuthCookieConstants.AccessTokenCookieName,
            normalizedToken,
            tokenCookieOptions);
    }

    public void ClearLoginCookies(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        var cookieOptions = CreateAuthCookieOptions(context);
        context.Response.Cookies.Delete(AuthCookieConstants.AccessTokenCookieName, cookieOptions);
    }

    private static CookieOptions CreateAuthCookieOptions(HttpContext context)
    {
        var isHttps = context.Request.IsHttps;
        var sameSiteMode = isHttps ? SameSiteMode.None : SameSiteMode.Lax;

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = sameSiteMode,
            Path = "/",
            IsEssential = true
        };
    }

    private static DateTimeOffset? TryReadJwtExpiration(string token)
    {
        try
        {
            var jwtToken = new JwtSecurityTokenHandler().ReadJwtToken(token);
            return jwtToken.ValidTo == DateTime.MinValue
                ? null
                : new DateTimeOffset(jwtToken.ValidTo, TimeSpan.Zero);
        }
        catch (ArgumentException)
        {
            return null;
        }
    }
}
