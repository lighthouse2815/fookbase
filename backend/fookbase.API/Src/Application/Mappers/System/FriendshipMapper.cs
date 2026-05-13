using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Friendships;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Common.Utilities;

namespace InteractHub.Api.Application.Mappers;

public static class FriendshipMapper
{
    public static List<ContactDto> ToContactDtos(
        IEnumerable<Guid> contactUserIds,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> profileLookup,
        string fallbackDisplayName = "user")
    {
        ArgumentNullException.ThrowIfNull(contactUserIds);
        ArgumentNullException.ThrowIfNull(profileLookup);

        var distinctContactIds = contactUserIds
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList();

        if (distinctContactIds.Count == 0)
        {
            return new List<ContactDto>();
        }

        var summaries = UserProfileSummaryMapper.ToAuthorSummaries(
            distinctContactIds,
            profileLookup,
            fallbackDisplayName);

        return distinctContactIds
            .Select(contactUserId => ToContactDto(contactUserId, summaries[contactUserId]))
            .OrderBy(contact => contact.NickName, StringComparer.OrdinalIgnoreCase)
            .ThenBy(contact => contact.UserId, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public static ContactDto ToContactDto(Guid contactUserId, AuthorSummaryDto summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        var contactId = contactUserId.ToString();
        return new ContactDto
        {
            ContactId = contactId,
            UserId = contactId,
            AvatarUrl = summary.AvatarUrl,
            NickName = summary.DisplayName
        };
    }

    public static List<FriendSuggestionResponseDto> ToResponseDtos(this IEnumerable<FriendSuggestionDto> suggestions)
    {
        ArgumentNullException.ThrowIfNull(suggestions);
        return suggestions
            .Select((item, index) => item.ToResponseDto(index))
            .ToList();
    }

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
            ? AvatarUrlHelper.BuildDefaultAvatarUrl(safeId)
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

    public static List<BlockedUserResponseDto> ToResponseDtos(this IEnumerable<BlockedUserDto> blockedUsers)
    {
        ArgumentNullException.ThrowIfNull(blockedUsers);
        return blockedUsers
            .Select((item, index) => item.ToResponseDto(index))
            .ToList();
    }

    public static List<BlockedUserResponseDto> ToResponseDtos(
        IReadOnlyDictionary<Guid, DateTime> blockedUserLookup,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> profileLookup,
        string fallbackDisplayName = "Nguoi dung")
    {
        ArgumentNullException.ThrowIfNull(blockedUserLookup);
        ArgumentNullException.ThrowIfNull(profileLookup);

        var blockedUserIds = blockedUserLookup.Keys
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList();

        if (blockedUserIds.Count == 0)
        {
            return new List<BlockedUserResponseDto>();
        }

        return blockedUserIds
            .Select(userId =>
            {
                var profile = profileLookup.TryGetValue(userId, out var value) ? value : null;
                var author = UserProfileSummaryMapper.ToAuthorSummary(userId, profile, fallbackDisplayName);
                var blockedAt = blockedUserLookup[userId];

                return new BlockedUserResponseDto
                {
                    UserId = userId.ToString(),
                    DisplayName = author.DisplayName,
                    AvatarUrl = author.AvatarUrl ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId),
                    BlockedAt = blockedAt
                };
            })
            .OrderByDescending(user => user.BlockedAt)
            .ThenBy(user => user.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ThenBy(user => user.UserId, StringComparer.OrdinalIgnoreCase)
            .ToList();
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
            ? AvatarUrlHelper.BuildDefaultAvatarUrl(safeId)
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



