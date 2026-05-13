using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.DTOs.SavedPosts;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Mappers;

public static class SavedPostMapper
{
    public static PostResponseDto ToSavedPostResponseDto(
        this Post post,
        Guid currentUserId,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> profileLookup,
        IReadOnlySet<Guid> blockedUserIds,
        IReadOnlySet<Guid> viewerFriendUserIds,
        IReadOnlyDictionary<Guid, int>? shareCountLookup = null)
    {
        ArgumentNullException.ThrowIfNull(post);
        ArgumentNullException.ThrowIfNull(profileLookup);
        ArgumentNullException.ThrowIfNull(blockedUserIds);

        var authorLookup = profileLookup.ToDictionary(
            pair => pair.Key,
            pair => UserProfileSummaryMapper.ToAuthorSummary(
                pair.Key,
                pair.Value,
                fallbackDisplayName: "user"));

        return post.ToResponseDto(
            currentUserId,
            blockedUserIds,
            author: ResolveAuthorSummary(post.UserId, profileLookup),
            shareCountLookup: shareCountLookup,
            authorsByUserId: authorLookup,
            viewerFriendUserIds: viewerFriendUserIds);
    }

    public static SavedPostStateResponseDto ToStateResponseDto(Guid postId, bool saved, DateTime? savedAt = null)
    {
        return new SavedPostStateResponseDto
        {
            PostId = postId,
            Saved = saved,
            SavedAt = savedAt
        };
    }

    private static AuthorSummaryDto ResolveAuthorSummary(
        Guid userId,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> profileLookup)
    {
        var profile = profileLookup.TryGetValue(userId, out var value) ? value : null;
        return UserProfileSummaryMapper.ToAuthorSummary(userId, profile, fallbackDisplayName: "user");
    }

}
