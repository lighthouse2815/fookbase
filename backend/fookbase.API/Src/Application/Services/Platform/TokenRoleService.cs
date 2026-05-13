using System.IdentityModel.Tokens.Jwt;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;

namespace InteractHub.Api.Application.Services;

public class TokenRoleService : ITokenRoleService
{
    public bool IsAdmin(string? roleHint, string? token)
    {
        if (IsAdminRoleValue(roleHint))
        {
            return true;
        }

        var normalizedToken = token.NormalizeAccessTokenOrNull();
        if (string.IsNullOrWhiteSpace(normalizedToken))
        {
            return false;
        }

        try
        {
            var jwtToken = new JwtSecurityTokenHandler().ReadJwtToken(normalizedToken);
            return jwtToken.Claims
                .Where(claim => IsRoleClaimType(claim.Type))
                .SelectMany(claim => ExpandRoleValues(claim.Value))
                .Any(IsAdminRoleValue);
        }
        catch (ArgumentException)
        {
            return false;
        }
    }

    private static bool IsRoleClaimType(string claimType)
    {
        return string.Equals(claimType, AuthClaimTypes.Role, StringComparison.Ordinal)
            || string.Equals(claimType, "roles", StringComparison.OrdinalIgnoreCase)
            || string.Equals(claimType, "authorities", StringComparison.OrdinalIgnoreCase)
            || string.Equals(claimType, "authority", StringComparison.OrdinalIgnoreCase);
    }

    private static IEnumerable<string> ExpandRoleValues(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return Array.Empty<string>();
        }

        return rawValue
            .Split([',', ';', ' '], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(value => value.Trim().Trim('"', '\'', '[', ']'))
            .Where(value => !string.IsNullOrWhiteSpace(value));
    }

    private static bool IsAdminRoleValue(string? roleValue)
    {
        if (string.IsNullOrWhiteSpace(roleValue))
        {
            return false;
        }

        var normalizedRole = roleValue.Trim();
        if (normalizedRole.StartsWith("ROLE_", StringComparison.OrdinalIgnoreCase))
        {
            normalizedRole = normalizedRole[5..];
        }

        return string.Equals(normalizedRole, AppRoles.Admin, StringComparison.OrdinalIgnoreCase);
    }
}



