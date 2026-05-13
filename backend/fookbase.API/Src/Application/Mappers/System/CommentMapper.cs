using InteractHub.Api.Application.DTOs.Comments;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Mappers;

public static class CommentMapper
{
    public sealed record CommentReactionSummary(int Count, IReadOnlyList<ReactionType> TopTypes);

    public static CommentResponseDto ToBaseResponseDto(this Comment comment)
    {
        ArgumentNullException.ThrowIfNull(comment);

        return new CommentResponseDto
        {
            Id = comment.Id,
            PostId = comment.PostId,
            ParentCommentId = comment.ParentCommentId,
            UserId = comment.UserId,
            Author = new AuthorSummaryDto
            {
                Id = comment.UserId,
                DisplayName = "user",
                AvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(comment.UserId)
            },
            Content = comment.Content,
            MediaUrls = ResolveCommentMediaUrls(comment),
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        };
    }

    public static CommentResponseDto ToEnrichedResponseDto(
        this Comment comment,
        IReadOnlyDictionary<Guid, AuthorSummaryDto> authors,
        IReadOnlyDictionary<Guid, ReactionType> currentUserReactions,
        IReadOnlyDictionary<Guid, CommentReactionSummary> reactionSummaries)
    {
        ArgumentNullException.ThrowIfNull(comment);
        ArgumentNullException.ThrowIfNull(authors);
        ArgumentNullException.ThrowIfNull(currentUserReactions);
        ArgumentNullException.ThrowIfNull(reactionSummaries);

        var dto = comment.ToBaseResponseDto();
        var reactionSummary = reactionSummaries.TryGetValue(comment.Id, out var resolvedReactionSummary)
            ? resolvedReactionSummary
            : EmptyReactionSummary();

        return dto with
        {
            Author = authors.TryGetValue(comment.UserId, out var author)
                ? author
                : CreateFallbackAuthor(comment.UserId),
            CurrentUserReactionType = currentUserReactions.TryGetValue(comment.Id, out var reactionType)
                ? reactionType
                : null,
            ReactionCount = reactionSummary.Count,
            TopReactionTypes = reactionSummary.TopTypes
        };
    }

    public static Dictionary<Guid, List<Comment>> BuildChildrenLookup(this IEnumerable<Comment> comments)
    {
        ArgumentNullException.ThrowIfNull(comments);

        return comments
            .Where(comment => comment.ParentCommentId.HasValue)
            .GroupBy(comment => comment.ParentCommentId!.Value)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderBy(comment => comment.CreatedAt)
                    .ToList());
    }

    public static HashSet<Guid> CollectSubtreeIds(
        IEnumerable<Guid> rootIds,
        IReadOnlyDictionary<Guid, List<Comment>> childrenByParentId)
    {
        ArgumentNullException.ThrowIfNull(rootIds);
        ArgumentNullException.ThrowIfNull(childrenByParentId);

        var collectedIds = new HashSet<Guid>();
        var queue = new Queue<Guid>(rootIds);

        while (queue.Count > 0)
        {
            var currentId = queue.Dequeue();
            if (!collectedIds.Add(currentId))
            {
                continue;
            }

            if (!childrenByParentId.TryGetValue(currentId, out var children))
            {
                continue;
            }

            foreach (var child in children)
            {
                queue.Enqueue(child.Id);
            }
        }

        return collectedIds;
    }

    public static CommentResponseDto BuildCommentTree(
        Guid commentId,
        IReadOnlyDictionary<Guid, CommentResponseDto> mappedById,
        IReadOnlyDictionary<Guid, List<Comment>> childrenByParentId,
        IReadOnlySet<Guid> includedIds)
    {
        ArgumentNullException.ThrowIfNull(mappedById);
        ArgumentNullException.ThrowIfNull(childrenByParentId);
        ArgumentNullException.ThrowIfNull(includedIds);

        var dto = mappedById[commentId];
        var childDtos = childrenByParentId.TryGetValue(commentId, out var children)
            ? children
                .Where(child => includedIds.Contains(child.Id) && mappedById.ContainsKey(child.Id))
                .Select(child => BuildCommentTree(child.Id, mappedById, childrenByParentId, includedIds))
                .ToList()
            : [];

        return dto with
        {
            ReplyCount = childDtos.Count,
            Replies = childDtos
        };
    }

    public static CommentReactionSummary EmptyReactionSummary()
    {
        return new CommentReactionSummary(0, Array.Empty<ReactionType>());
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

    private static IReadOnlyList<string> ResolveCommentMediaUrls(Comment comment)
    {
        var orderedMediaUrls = comment.MediaItems
            .OrderBy(media => media.SortOrder)
            .Select(media => media.MediaUrl)
            .ToList();

        return PostMediaSerializer.Normalize(orderedMediaUrls);
    }
}
