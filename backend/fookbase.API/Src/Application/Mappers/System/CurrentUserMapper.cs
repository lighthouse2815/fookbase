using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Users;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Utilities;

namespace InteractHub.Api.Application.Mappers;

public static class CurrentUserMapper
{
    public static CurrentUserResponseDto ToCurrentUserResponseDto(
        Guid userId,
        UserProfileSummaryDto profile)
    {
        ArgumentNullException.ThrowIfNull(profile);

        var displayName = profile.DisplayName.TrimToNull() ?? "user";
        var avatarUrl = profile.AvatarUrl.TrimToNull() ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId);

        return new CurrentUserResponseDto
        {
            UserId = userId,
            DisplayName = displayName,
            AvatarUrl = avatarUrl
        };
    }

    public static SecurityAccountInfoResponseDto ToSecurityAccountInfoResponseDto(
        this UserSecurityPrivateDto privateProfile,
        string? usernameFromClaims)
    {
        ArgumentNullException.ThrowIfNull(privateProfile);

        var resolvedUsername = privateProfile.Username.TrimToNull()
            ?? usernameFromClaims.TrimToNull()
            ?? string.Empty;

        return new SecurityAccountInfoResponseDto
        {
            Username = resolvedUsername,
            Email = privateProfile.Email.TrimToNull(),
            PhoneNumber = privateProfile.PhoneNumber.TrimToNull()
        };
    }

    public static UpdateSecurityAccountRequestDto ToNormalizedRequest(
        this UpdateSecurityAccountRequestDto request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new UpdateSecurityAccountRequestDto
        {
            Username = request.Username.TrimToNull(),
            PhoneNumber = request.PhoneNumber.TrimToNull()
        };
    }
}
