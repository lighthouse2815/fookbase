using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using System.Security.Claims;
using InteractHub.Api.Common.Constants;

namespace InteractHub.Api.Common.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static bool TryGetUserId(this ClaimsPrincipal? principal, out Guid userId)
    {
        var rawUserId = principal?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal?.FindFirstValue("sub");

        if (Guid.TryParse(rawUserId, out userId))
        {
            return true;
        }

        userId = Guid.Empty;
        return false;
    }

    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var rawUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub")
            ?? throw new BusinessException(ErrorCode.UNAUTHORIZED, "Missing user id claim.");

        if (!Guid.TryParse(rawUserId, out var userId))
        {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Invalid user id claim.");
        }

        return userId;
    }

    public static bool IsAdmin(this ClaimsPrincipal principal)
    {
        if (principal.IsInRole(AppRoles.Admin))
        {
            return true;
        }

        return principal.Claims
            .Where(claim => IsRoleClaimType(claim.Type))
            .SelectMany(claim => ExpandRoleValues(claim.Value))
            .Any(IsAdminRoleValue);
    }

    public static string? GetUsernameOrNull(this ClaimsPrincipal principal)
    {
        var claimCandidates = new[]
        {
            "username",
            ClaimTypes.Name,
            "preferred_username",
            "unique_name",
            "name",
            ClaimTypes.Email,
            "email"
        };

        foreach (var claimType in claimCandidates)
        {
            var rawValue = principal.FindFirstValue(claimType);
            if (string.IsNullOrWhiteSpace(rawValue))
            {
                continue;
            }

            var normalized = rawValue.NormalizeUsernameOrNull();
            if (!string.IsNullOrWhiteSpace(normalized))
            {
                return normalized;
            }
        }

        return null;
    }

    private static bool IsRoleClaimType(string claimType)
    {
        return string.Equals(claimType, AuthClaimTypes.Role, StringComparison.Ordinal)
            || string.Equals(claimType, ClaimTypes.Role, StringComparison.Ordinal)
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



