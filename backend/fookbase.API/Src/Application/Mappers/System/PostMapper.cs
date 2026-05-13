using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Mappers;

public static class PostMapper
{
    public static PostResponseDto ToBaseResponseDto(this Post post)
    {
        ArgumentNullException.ThrowIfNull(post);

        var mediaUrls = ResolvePostMediaUrls(post);
        var reactionCount = post.Likes.Count;
        var topReactionTypes = post.Likes
            .GroupBy(like => like.Type)
            .OrderByDescending(group => group.Count())
            .ThenBy(group => group.Key)
            .Take(3)
            .Select(group => group.Key)
            .ToList();

        return new PostResponseDto
        {
            Id = post.Id,
            UserId = post.UserId,
            Author = new AuthorSummaryDto
            {
                Id = post.UserId,
                DisplayName = "user",
                AvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(post.UserId)
            },
            Content = post.Content,
            ImageUrls = mediaUrls,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            LikeCount = reactionCount,
            ReactionCount = reactionCount,
            CurrentUserReactionType = null,
            TopReactionTypes = topReactionTypes,
            CommentCount = post.Comments.Count,
            Hashtags = post.PostHashtags
                .Where(postHashtag => postHashtag.Hashtag is not null)
                .Select(postHashtag => $"#{postHashtag.Hashtag!.Name}")
                .Distinct()
                .ToList()
        };
    }

    public static PostResponseDto ToResponseDto(
        this Post post,
        Guid? currentUserId,
        IReadOnlySet<Guid>? blockedUserIds = null,
        AuthorSummaryDto? author = null)
    {
        ArgumentNullException.ThrowIfNull(post);

        var effectiveBlockedUserIds = blockedUserIds ?? EmptyBlockedUserIds;
        var currentUserReactionType = GetCurrentUserReactionType(post, currentUserId);

        return post.ToBaseResponseDto() with
        {
            Author = author ?? CreateFallbackAuthor(post.UserId),
            CurrentUserReactionType = currentUserReactionType,
            LikedByCurrentUser = currentUserReactionType is not null,
            CommentCount = ResolveVisibleCommentCount(post, effectiveBlockedUserIds)
        };
    }

    public static List<PostResponseDto> ToResponseDtos(
        this IReadOnlyList<Post> posts,
        IReadOnlyDictionary<Guid, AuthorSummaryDto> authors,
        Guid? currentUserId,
        IReadOnlySet<Guid>? blockedUserIds = null)
    {
        ArgumentNullException.ThrowIfNull(posts);
        ArgumentNullException.ThrowIfNull(authors);

        var effectiveBlockedUserIds = blockedUserIds ?? EmptyBlockedUserIds;

        return posts
            .Select(post => post.ToResponseDto(
                currentUserId,
                effectiveBlockedUserIds,
                authors.TryGetValue(post.UserId, out var author) ? author : null))
            .ToList();
    }

    private static AuthorSummaryDto CreateFallbackAuthor(Guid userId)
    {
        return new AuthorSummaryDto
        {
            Id = userId,
            DisplayName = "user",
            AvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
        };
    }

    private static ReactionType? GetCurrentUserReactionType(Post post, Guid? currentUserId)
    {
        if (!currentUserId.HasValue)
        {
            return null;
        }

        var reaction = post.Likes.FirstOrDefault(like => like.UserId == currentUserId.Value);
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

    private static IReadOnlyList<string> ResolvePostMediaUrls(Post post)
    {
        var orderedMediaUrls = post.MediaItems
            .OrderBy(media => media.SortOrder)
            .Select(media => media.MediaUrl)
            .ToList();

        return PostMediaSerializer.Normalize(orderedMediaUrls);
    }

    private static readonly IReadOnlySet<Guid> EmptyBlockedUserIds = new HashSet<Guid>();
}
