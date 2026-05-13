using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;

namespace InteractHub.Api.Application.Interfaces.Services;

public static class AccessTokenProviderExtensions
{
    public static bool TryGetAccessToken(this IAccessTokenProvider accessTokenProvider, out string accessToken)
    {
        ArgumentNullException.ThrowIfNull(accessTokenProvider);

        accessToken = accessTokenProvider.GetAccessTokenOrNull() ?? string.Empty;
        return !string.IsNullOrWhiteSpace(accessToken);
    }

    public static string GetRequiredAccessToken(this IAccessTokenProvider accessTokenProvider)
    {
        ArgumentNullException.ThrowIfNull(accessTokenProvider);

        if (!accessTokenProvider.TryGetAccessToken(out var accessToken))
        {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        return accessToken;
    }
}



