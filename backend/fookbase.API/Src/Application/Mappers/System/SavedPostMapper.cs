using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.DTOs.SavedPosts;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Mappers;

public static class SavedPostMapper
{
    public static PostResponseDto ToSavedPostResponseDto(
        this Post post,
        Guid currentUserId,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> profileLookup,
        IReadOnlySet<Guid> blockedUserIds)
    {
        ArgumentNullException.ThrowIfNull(post);
        ArgumentNullException.ThrowIfNull(profileLookup);
        ArgumentNullException.ThrowIfNull(blockedUserIds);

        var dto = post.ToBaseResponseDto();
        var currentUserReactionType = GetCurrentUserReactionType(post, currentUserId);

        return dto with
        {
            Author = ResolveAuthorSummary(post.UserId, profileLookup),
            CurrentUserReactionType = currentUserReactionType,
            LikedByCurrentUser = currentUserReactionType is not null,
            CommentCount = ResolveVisibleCommentCount(post, blockedUserIds)
        };
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

    private static ReactionType? GetCurrentUserReactionType(Post post, Guid currentUserId)
    {
        var reaction = post.Likes.FirstOrDefault(like => like.UserId == currentUserId);
        if (reaction is null)
        {
            return null;
        }

        return reaction.Type;
    }

    private static int ResolveVisibleCommentCount(Post post, IReadOnlySet<Guid> blockedUserIds)
    {
        if (blockedUserIds.Count == 0)
        {
            return post.Comments.Count;
        }

        return post.Comments.Count(comment => !blockedUserIds.Contains(comment.UserId));
    }
}
