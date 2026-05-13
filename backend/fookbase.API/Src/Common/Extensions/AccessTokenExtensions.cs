namespace InteractHub.Api.Common.Extensions;

public static class AccessTokenExtensions
{
    private const string BearerPrefix = "Bearer ";

    public static string? NormalizeAccessTokenOrNull(this string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var normalized = token.Trim();

        if (normalized.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase))
        {
            normalized = normalized[BearerPrefix.Length..].Trim();
        }

        return string.IsNullOrWhiteSpace(normalized)
            ? null
            : normalized;
    }

    public static string NormalizeAccessToken(this string? token)
    {
        return token.NormalizeAccessTokenOrNull() ?? string.Empty;
    }
}



