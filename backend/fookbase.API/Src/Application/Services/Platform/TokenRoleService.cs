using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;

namespace InteractHub.Api.Application.Services;

public class TokenRoleService : ITokenRoleService
{
    private static readonly string[] RoleClaimTypes =
    [
        ClaimTypes.Role,
        "role",
        "roles",
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"
    ];

    public bool IsAdmin(string? roleHint, string? token)
    {
        if (string.Equals(roleHint, AppRoles.Admin, StringComparison.OrdinalIgnoreCase))
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
            return jwtToken.Claims.Any(claim =>
                IsRoleClaimType(claim.Type)
                && string.Equals(claim.Value, AppRoles.Admin, StringComparison.OrdinalIgnoreCase));
        }
        catch (ArgumentException)
        {
            return false;
        }
    }

    private static bool IsRoleClaimType(string claimType)
    {
        return RoleClaimTypes.Any(type => string.Equals(type, claimType, StringComparison.OrdinalIgnoreCase));
    }
}
