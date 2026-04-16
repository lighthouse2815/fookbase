using InteractHub.Api.Application.DTOs.Friendships;
using InteractHub.Api.Application.DTOs.JavaApi;

namespace InteractHub.Api.Application.Mappers;

public static class FriendshipMapper
{
    public static FriendSuggestionResponseDto ToResponseDto(this FriendSuggestionDto suggestion, int index)
    {
        ArgumentNullException.ThrowIfNull(suggestion);

        var safeId = string.IsNullOrWhiteSpace(suggestion.Id)
            ? $"suggestion-{index + 1}"
            : suggestion.Id.Trim();
        var fullName = string.IsNullOrWhiteSpace(suggestion.DisplayName)
            ? "Nguoi dung"
            : suggestion.DisplayName.Trim();
        var avatarUrl = string.IsNullOrWhiteSpace(suggestion.AvatarUrl)
            ? $"https://i.pravatar.cc/150?u={safeId}"
            : suggestion.AvatarUrl.Trim();
        var mutualFriends = suggestion.MutualFriends < 0
            ? 0
            : suggestion.MutualFriends;

        return new FriendSuggestionResponseDto
        {
            Id = safeId,
            FullName = fullName,
            AvatarUrl = avatarUrl,
            MutualFriends = mutualFriends
        };
    }

    public static BlockedUserResponseDto ToResponseDto(this BlockedUserDto blockedUser, int index)
    {
        ArgumentNullException.ThrowIfNull(blockedUser);

        var safeId = string.IsNullOrWhiteSpace(blockedUser.UserId)
            ? $"blocked-user-{index + 1}"
            : blockedUser.UserId.Trim();
        var displayName = string.IsNullOrWhiteSpace(blockedUser.DisplayName)
            ? "Nguoi dung"
            : blockedUser.DisplayName.Trim();
        var avatarUrl = string.IsNullOrWhiteSpace(blockedUser.AvatarUrl)
            ? $"https://i.pravatar.cc/150?u={safeId}"
            : blockedUser.AvatarUrl.Trim();

        return new BlockedUserResponseDto
        {
            UserId = safeId,
            DisplayName = displayName,
            AvatarUrl = avatarUrl,
            BlockedAt = blockedUser.BlockedAt
        };
    }
}
