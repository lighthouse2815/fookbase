using System.IdentityModel.Tokens.Jwt;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Infrastructure.Services;

public class AuthCookieService : IAuthCookieService
{
    public void SetLoginCookies(HttpContext context, string accessToken, string? refreshToken = null)
    {
        ArgumentNullException.ThrowIfNull(context);

        var normalizedAccessToken = accessToken.NormalizeAccessToken();
        if (string.IsNullOrWhiteSpace(normalizedAccessToken))
        {
            return;
        }

        var accessTokenCookieOptions = CreateAuthCookieOptions(context);
        var accessExpiration = TryReadJwtExpiration(normalizedAccessToken);

        if (accessExpiration.HasValue)
        {
            accessTokenCookieOptions.Expires = accessExpiration.Value;
        }

        context.Response.Cookies.Append(
            AuthCookieConstants.AccessTokenCookieName,
            normalizedAccessToken,
            accessTokenCookieOptions);

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var normalizedRefreshToken = refreshToken.Trim();
        var refreshTokenCookieOptions = CreateAuthCookieOptions(context);
        var refreshExpiration = TryReadJwtExpiration(normalizedRefreshToken);
        if (refreshExpiration.HasValue)
        {
            refreshTokenCookieOptions.Expires = refreshExpiration.Value;
        }

        context.Response.Cookies.Append(
            AuthCookieConstants.RefreshTokenCookieName,
            normalizedRefreshToken,
            refreshTokenCookieOptions);
    }

    public void ClearLoginCookies(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        var cookieOptions = CreateAuthCookieOptions(context);
        context.Response.Cookies.Delete(AuthCookieConstants.AccessTokenCookieName, cookieOptions);
        context.Response.Cookies.Delete(AuthCookieConstants.RefreshTokenCookieName, cookieOptions);
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



