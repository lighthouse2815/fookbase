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
                .ToList(),
            ShareCount = 0,
            OriginalPost = null
        };
    }

    public static PostResponseDto ToResponseDto(
        this Post post,
        Guid? currentUserId,
        IReadOnlySet<Guid>? blockedUserIds = null,
        AuthorSummaryDto? author = null,
        IReadOnlyDictionary<Guid, int>? shareCountLookup = null,
        IReadOnlyDictionary<Guid, AuthorSummaryDto>? authorsByUserId = null)
    {
        ArgumentNullException.ThrowIfNull(post);

        var effectiveBlockedUserIds = blockedUserIds ?? EmptyBlockedUserIds;
        var currentUserReactionType = GetCurrentUserReactionType(post, currentUserId);
        var shareCount = ResolveShareCount(post.Id, shareCountLookup);
        var originalPost = ResolveOriginalPostReference(post.OriginalPost, effectiveBlockedUserIds, authorsByUserId);

        return post.ToBaseResponseDto() with
        {
            Author = author ?? CreateFallbackAuthor(post.UserId),
            CurrentUserReactionType = currentUserReactionType,
            LikedByCurrentUser = currentUserReactionType is not null,
            CommentCount = ResolveVisibleCommentCount(post, effectiveBlockedUserIds),
            ShareCount = shareCount,
            OriginalPost = originalPost
        };
    }

    public static List<PostResponseDto> ToResponseDtos(
        this IReadOnlyList<Post> posts,
        IReadOnlyDictionary<Guid, AuthorSummaryDto> authors,
        Guid? currentUserId,
        IReadOnlySet<Guid>? blockedUserIds = null,
        IReadOnlyDictionary<Guid, int>? shareCountLookup = null)
    {
        ArgumentNullException.ThrowIfNull(posts);
        ArgumentNullException.ThrowIfNull(authors);

        var effectiveBlockedUserIds = blockedUserIds ?? EmptyBlockedUserIds;

        return posts
            .Select(post => post.ToResponseDto(
                currentUserId,
                effectiveBlockedUserIds,
                authors.TryGetValue(post.UserId, out var author) ? author : null,
                shareCountLookup,
                authors))
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

    private static SharedPostReferenceDto? ResolveOriginalPostReference(
        Post? originalPost,
        IReadOnlySet<Guid> blockedUserIds,
        IReadOnlyDictionary<Guid, AuthorSummaryDto>? authorsByUserId)
    {
        if (originalPost is null)
        {
            return null;
        }

        if (blockedUserIds.Contains(originalPost.UserId))
        {
            return null;
        }

        var author = ResolveAuthorSummary(originalPost.UserId, authorsByUserId);
        return new SharedPostReferenceDto
        {
            Id = originalPost.Id,
            UserId = originalPost.UserId,
            Author = author,
            Content = originalPost.Content,
            ImageUrls = ResolvePostMediaUrls(originalPost),
            CreatedAt = originalPost.CreatedAt,
            ReactionCount = originalPost.Likes.Count,
            CommentCount = ResolveVisibleCommentCount(originalPost, blockedUserIds)
        };
    }

    private static AuthorSummaryDto ResolveAuthorSummary(
        Guid userId,
        IReadOnlyDictionary<Guid, AuthorSummaryDto>? authorsByUserId)
    {
        if (authorsByUserId is not null && authorsByUserId.TryGetValue(userId, out var author))
        {
            return author;
        }

        return CreateFallbackAuthor(userId);
    }

    private static int ResolveShareCount(Guid postId, IReadOnlyDictionary<Guid, int>? shareCountLookup)
    {
        if (shareCountLookup is null)
        {
            return 0;
        }

        return shareCountLookup.TryGetValue(postId, out var count) ? Math.Max(0, count) : 0;
    }

    private static readonly IReadOnlySet<Guid> EmptyBlockedUserIds = new HashSet<Guid>();
}
