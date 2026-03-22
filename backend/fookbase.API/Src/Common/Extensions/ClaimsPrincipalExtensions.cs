using System.Security.Claims;
using InteractHub.Api.Common.Constants;

namespace InteractHub.Api.Common.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var rawUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Missing user id claim.");

        if (!Guid.TryParse(rawUserId, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user id claim.");
        }

        return userId;
    }

    public static bool IsAdmin(this ClaimsPrincipal principal)
    {
        return principal.Claims.Any(claim =>
            (claim.Type == ClaimTypes.Role || claim.Type == "role")
            && string.Equals(claim.Value, AppRoles.Admin, StringComparison.OrdinalIgnoreCase));
    }
}