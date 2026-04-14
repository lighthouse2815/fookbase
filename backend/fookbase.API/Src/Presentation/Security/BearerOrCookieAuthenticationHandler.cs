using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text;
using System.Text.Json;
using System.Globalization;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Presentation.Security;

public sealed class BearerOrCookieAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public BearerOrCookieAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var accessToken = ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        if (TryReadJwtExpiration(accessToken, out var expiresAt)
            && expiresAt <= DateTimeOffset.UtcNow)
        {
            Logger.LogWarning("Auth failed: token expired at {ExpiresAtUtc}.", expiresAt.UtcDateTime);
            return Task.FromResult(AuthenticateResult.Fail("Token expired."));
        }

        if (!TryResolveUserId(accessToken, out var userId))
        {
            Logger.LogWarning("Auth failed: cannot resolve user id. HasUserIdCookie={HasUserIdCookie}", Request.Cookies.ContainsKey(AuthCookieConstants.UserIdCookieName));
            return Task.FromResult(AuthenticateResult.Fail("Cannot resolve user id from token."));
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new("sub", userId.ToString())
        };

        var role = ResolveRole(accessToken);
        if (!string.IsNullOrWhiteSpace(role))
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
            claims.Add(new Claim("role", role));
        }

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    protected override Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = StatusCodes.Status401Unauthorized;
        Response.ContentType = "application/json";
        return Response.WriteAsJsonAsync(ApiResponse<object>.Fail("Unauthorized."));
    }

    protected override Task HandleForbiddenAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = StatusCodes.Status403Forbidden;
        Response.ContentType = "application/json";
        return Response.WriteAsJsonAsync(ApiResponse<object>.Fail("Forbidden."));
    }

    private string? ExtractAccessToken()
    {
        var tokenFromAuthorization = Request.Headers.Authorization.ToString().NormalizeAccessTokenOrNull();
        if (!string.IsNullOrWhiteSpace(tokenFromAuthorization))
        {
            return tokenFromAuthorization;
        }

        if (Request.Path.StartsWithSegments("/hubs")
            && Request.Query.TryGetValue("access_token", out var accessTokenQueryValue))
        {
            var tokenFromQuery = accessTokenQueryValue.ToString().NormalizeAccessTokenOrNull();
            if (!string.IsNullOrWhiteSpace(tokenFromQuery))
            {
                return tokenFromQuery;
            }
        }

        if (Request.Cookies.TryGetValue(AuthCookieConstants.AccessTokenCookieName, out var cookieToken)
            && !string.IsNullOrWhiteSpace(cookieToken))
        {
            return cookieToken.NormalizeAccessTokenOrNull();
        }

        return null;
    }

    private bool TryResolveUserId(string token, out Guid userId)
    {
        if (TryReadUserIdFromJwtPayload(token, out userId))
        {
            return true;
        }

        var userIdHeader = Request.Headers["X-User-Id"].ToString();
        if (!string.IsNullOrWhiteSpace(userIdHeader)
            && Guid.TryParse(userIdHeader.Trim(), out userId))
        {
            return true;
        }

        if (Request.Cookies.TryGetValue(AuthCookieConstants.UserIdCookieName, out var rawUserId)
            && Guid.TryParse(rawUserId, out userId))
        {
            return true;
        }

        userId = Guid.Empty;
        return false;
    }

    private static bool TryReadUserIdFromJwtPayload(string token, out Guid userId)
    {
        userId = Guid.Empty;

        var tokenParts = token.Split('.');
        if (tokenParts.Length < 2)
        {
            return false;
        }

        var payloadJson = DecodeBase64Url(tokenParts[1]);
        if (string.IsNullOrWhiteSpace(payloadJson))
        {
            return false;
        }

        try
        {
            using var document = JsonDocument.Parse(payloadJson);
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return false;
            }

            var claimCandidates = new[]
            {
                "nameid",
                ClaimTypes.NameIdentifier,
                "sub",
                "userId",
                "user_id",
                "id"
            };

            foreach (var claimName in claimCandidates)
            {
                if (TryGetString(root, claimName, out var rawValue)
                    && Guid.TryParse(rawValue, out userId))
                {
                    return true;
                }
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return false;
    }

    private static bool TryReadJwtExpiration(string token, out DateTimeOffset expiresAt)
    {
        expiresAt = default;

        var tokenParts = token.Split('.');
        if (tokenParts.Length < 2)
        {
            return false;
        }

        var payloadJson = DecodeBase64Url(tokenParts[1]);
        if (string.IsNullOrWhiteSpace(payloadJson))
        {
            return false;
        }

        try
        {
            using var document = JsonDocument.Parse(payloadJson);
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return false;
            }

            if (!root.TryGetProperty("exp", out var expElement))
            {
                return false;
            }

            long expUnixSeconds;
            if (expElement.ValueKind == JsonValueKind.Number)
            {
                if (!expElement.TryGetInt64(out expUnixSeconds))
                {
                    return false;
                }
            }
            else if (expElement.ValueKind == JsonValueKind.String
                     && long.TryParse(expElement.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out expUnixSeconds))
            {
                // parsed from string claim
            }
            else
            {
                return false;
            }

            expiresAt = DateTimeOffset.FromUnixTimeSeconds(expUnixSeconds);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
        catch (ArgumentOutOfRangeException)
        {
            return false;
        }
    }

    private static string? ResolveRole(string token)
    {
        var tokenParts = token.Split('.');
        if (tokenParts.Length < 2)
        {
            return null;
        }

        var payloadJson = DecodeBase64Url(tokenParts[1]);
        if (string.IsNullOrWhiteSpace(payloadJson))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(payloadJson);
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            if (TryGetString(root, ClaimTypes.Role, out var claimRole))
            {
                return claimRole;
            }

            if (TryGetString(root, "role", out claimRole))
            {
                return claimRole;
            }

            if (root.TryGetProperty("roles", out var rolesElement))
            {
                if (rolesElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var roleElement in rolesElement.EnumerateArray())
                    {
                        if (roleElement.ValueKind == JsonValueKind.String)
                        {
                            return roleElement.GetString();
                        }
                    }
                }

                if (rolesElement.ValueKind == JsonValueKind.String)
                {
                    return rolesElement.GetString();
                }
            }
        }
        catch (JsonException)
        {
            return null;
        }

        return null;
    }

    private static bool TryGetString(JsonElement element, string propertyName, out string value)
    {
        value = string.Empty;

        if (!element.TryGetProperty(propertyName, out var property))
        {
            return false;
        }

        if (property.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        var rawValue = property.GetString();
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return false;
        }

        value = rawValue.Trim();
        return true;
    }

    private static string DecodeBase64Url(string encoded)
    {
        if (string.IsNullOrWhiteSpace(encoded))
        {
            return string.Empty;
        }

        var padded = encoded.Replace('-', '+').Replace('_', '/');
        var remainder = padded.Length % 4;
        if (remainder == 2)
        {
            padded += "==";
        }
        else if (remainder == 3)
        {
            padded += "=";
        }
        else if (remainder != 0)
        {
            return string.Empty;
        }

        try
        {
            var bytes = Convert.FromBase64String(padded);
            return Encoding.UTF8.GetString(bytes);
        }
        catch (FormatException)
        {
            return string.Empty;
        }
    }
}
