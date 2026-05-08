using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using System.Security.Claims;
using InteractHub.Api.Common.Constants;

namespace InteractHub.Api.Common.Extensions;

public static class ClaimsPrincipalExtensions
{
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
        return principal.Claims.Any(claim =>
            (claim.Type == ClaimTypes.Role || claim.Type == "role")
            && string.Equals(claim.Value, AppRoles.Admin, StringComparison.OrdinalIgnoreCase));
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
}
