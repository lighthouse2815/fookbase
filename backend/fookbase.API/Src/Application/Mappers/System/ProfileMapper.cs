using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;
using InteractHub.Api.Common.Utilities;

namespace InteractHub.Api.Application.Mappers;

public static class ProfileMapper
{
    public static bool IsBlockedRelationship(string? relationshipStatus)
    {
        return string.Equals(relationshipStatus, "BLOCKED", StringComparison.OrdinalIgnoreCase);
    }

    public static ProfileResponseDto ToBlockedProfileResponseDto(
        Guid requestedUserId,
        UserProfileDto profile,
        string? relationshipStatus)
    {
        ArgumentNullException.ThrowIfNull(profile);

        var resolvedUserId = profile.UserId == Guid.Empty ? requestedUserId : profile.UserId;
        return ToBlockedProfileResponseDto(
            resolvedUserId,
            profile.DisplayName,
            profile.AvatarUrl,
            relationshipStatus,
            profile.UserStatus);
    }

    public static ProfileResponseDto ToBlockedProfileResponseDto(
        Guid userId,
        string? displayName,
        string? avatarUrl,
        string? relationshipStatus = "BLOCKED",
        string? userStatus = null)
    {
        return new ProfileResponseDto
        {
            UserId = userId,
            DisplayName = FirstNonEmpty(displayName, "user") ?? "user",
            FullName = null,
            AvatarUrl = FirstNonEmpty(avatarUrl) ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId),
            FriendsCount = 0,
            PostsCount = 0,
            PhoneNumber = null,
            Email = null,
            Gender = null,
            BirthDate = null,
            FullNameVisible = false,
            PhoneVisible = false,
            EmailVisible = false,
            DateOfBirthVisible = false,
            GenderVisible = false,
            FriendCountVisible = false,
            Status = relationshipStatus,
            UserStatus = FirstNonEmpty(userStatus),
            Nickname = null
        };
    }

    public static ProfileResponseDto ToProfileResponseDto(
        Guid requestedUserId,
        UserProfileDto profile,
        int postsCount,
        string? relationshipStatus)
    {
        ArgumentNullException.ThrowIfNull(profile);

        var resolvedUserId = profile.UserId == Guid.Empty ? requestedUserId : profile.UserId;
        return new ProfileResponseDto
        {
            UserId = resolvedUserId,
            DisplayName = FirstNonEmpty(profile.DisplayName, "user") ?? "user",
            FullName = FirstNonEmpty(profile.FullName),
            AvatarUrl = FirstNonEmpty(profile.AvatarUrl) ?? AvatarUrlHelper.BuildDefaultAvatarUrl(resolvedUserId),
            FriendsCount = profile.FriendsCount < 0 ? 0 : profile.FriendsCount,
            PostsCount = postsCount < 0 ? 0 : postsCount,
            PhoneNumber = FirstNonEmpty(profile.PhoneNumber),
            Email = FirstNonEmpty(profile.Email),
            Gender = FirstNonEmpty(profile.Gender),
            BirthDate = FirstNonEmpty(profile.BirthDate),
            FullNameVisible = profile.FullNameVisible ?? true,
            PhoneVisible = profile.PhoneVisible ?? true,
            EmailVisible = profile.EmailVisible ?? true,
            DateOfBirthVisible = profile.DateOfBirthVisible ?? true,
            GenderVisible = profile.GenderVisible ?? true,
            FriendCountVisible = profile.FriendCountVisible ?? true,
            Status = relationshipStatus,
            UserStatus = FirstNonEmpty(profile.UserStatus),
            Nickname = FirstNonEmpty(profile.Nickname)
        };
    }

    public static MyProfileSettingsResponseDto ToMyProfileSettingsResponseDto(
        Guid requestedUserId,
        UserProfileOverviewDto? overview)
    {
        var resolvedUserId = requestedUserId;
        if (Guid.TryParse(overview?.UserId, out var userIdFromOverview))
        {
            resolvedUserId = userIdFromOverview;
        }

        var username = FirstNonEmpty(overview?.Username, "user") ?? "user";
        var displayName = FirstNonEmpty(
            overview?.DisplayName,
            overview?.FirstName,
            username,
            "user") ?? "user";

        return new MyProfileSettingsResponseDto
        {
            UserId = resolvedUserId,
            Username = username,
            DisplayName = displayName,
            FirstName = FirstNonEmpty(overview?.FirstName),
            LastName = FirstNonEmpty(overview?.LastName),
            Email = overview?.Email,
            PhoneNumber = MaskPhoneNumber(FirstNonEmpty(overview?.PhoneNumber)),
            AvatarUrl = FirstNonEmpty(overview?.AvatarUrl) ?? AvatarUrlHelper.BuildDefaultAvatarUrl(resolvedUserId),
            BirthDate = FirstNonEmpty(overview?.BirthDate),
            Gender = FirstNonEmpty(overview?.Gender)
        };
    }

    public static ProfilePageInfoSettingsResponseDto ToProfilePageInfoSettingsResponseDto(ProfileInfoSettingsDto settings)
    {
        ArgumentNullException.ThrowIfNull(settings);

        return new ProfilePageInfoSettingsResponseDto
        {
            FullName = FirstNonEmpty(settings.FullName, "user") ?? "user",
            PhoneNumber = FirstNonEmpty(settings.PhoneNumber),
            Email = FirstNonEmpty(settings.Email),
            DateOfBirth = FirstNonEmpty(settings.DateOfBirth),
            Gender = FirstNonEmpty(settings.Gender),
            FriendCount = settings.FriendCount < 0 ? 0 : settings.FriendCount
        };
    }

    public static ProfileInfoVisibilityResponseDto ToProfileInfoVisibilityResponseDto(ProfileInfoVisibilityDto visibility)
    {
        ArgumentNullException.ThrowIfNull(visibility);

        return new ProfileInfoVisibilityResponseDto
        {
            FullNameVisible = visibility.FullNameVisible,
            PhoneVisible = visibility.PhoneVisible,
            EmailVisible = visibility.EmailVisible,
            DateOfBirthVisible = visibility.DateOfBirthVisible,
            GenderVisible = visibility.GenderVisible,
            FriendCountVisible = visibility.FriendCountVisible
        };
    }

    public static List<UserProfileSearchDto> ToSearchResultList(UserProfileSearchDto? profile)
    {
        return profile is null
            ? new List<UserProfileSearchDto>()
            : new List<UserProfileSearchDto> { profile };
    }

    public static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return null;
    }

    public static string? MaskPhoneNumber(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            return null;
        }

        var normalized = phoneNumber.Trim();
        if (normalized.Contains('*', StringComparison.Ordinal))
        {
            return normalized;
        }

        if (normalized.Length < 7)
        {
            return "****";
        }

        return $"{normalized[..3]}****{normalized[^4..]}";
    }
}
