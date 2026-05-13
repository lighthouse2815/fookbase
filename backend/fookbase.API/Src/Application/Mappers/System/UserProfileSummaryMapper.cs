using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Utilities;

namespace InteractHub.Api.Application.Mappers;

public static class UserProfileSummaryMapper
{
    public static AuthorSummaryDto ToAuthorSummary(
        Guid userId,
        UserProfileSummaryDto? profile,
        string fallbackDisplayName = "user")
    {
        var displayName = profile?.DisplayName.TrimToNull() ?? fallbackDisplayName;
        var avatarUrl = profile?.AvatarUrl.TrimToNull() ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId);

        return new AuthorSummaryDto
        {
            Id = userId,
            DisplayName = displayName,
            AvatarUrl = avatarUrl
        };
    }

    public static Dictionary<Guid, AuthorSummaryDto> ToAuthorSummaries(
        IEnumerable<Guid> userIds,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> profileLookup,
        string fallbackDisplayName = "user")
    {
        var distinctUserIds = userIds
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList();

        return distinctUserIds.ToDictionary(
            userId => userId,
            userId =>
            {
                var profile = profileLookup.TryGetValue(userId, out var value) ? value : null;
                return ToAuthorSummary(userId, profile, fallbackDisplayName);
            });
    }

    public static async Task<AuthorSummaryDto> GetAuthorSummaryAsync(
        this IUserProfileSummaryReadModelService profileSummaryReadModelService,
        Guid userId,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null,
        string fallbackDisplayName = "user")
    {
        var profiles = await profileSummaryReadModelService.GetProfileSummariesAsync(
            [userId],
            cancellationToken,
            requireFresh,
            accessToken);

        var profile = profiles.TryGetValue(userId, out var value) ? value : null;
        return ToAuthorSummary(userId, profile, fallbackDisplayName);
    }

    public static async Task<Dictionary<Guid, AuthorSummaryDto>> GetAuthorSummariesAsync(
        this IUserProfileSummaryReadModelService profileSummaryReadModelService,
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null,
        string fallbackDisplayName = "user")
    {
        var distinctUserIds = userIds
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList();

        if (distinctUserIds.Count == 0)
        {
            return new Dictionary<Guid, AuthorSummaryDto>();
        }

        var profiles = await profileSummaryReadModelService.GetProfileSummariesAsync(
            distinctUserIds,
            cancellationToken,
            requireFresh,
            accessToken);

        return ToAuthorSummaries(distinctUserIds, profiles, fallbackDisplayName);
    }
}

