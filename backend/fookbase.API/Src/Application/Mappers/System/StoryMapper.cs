using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Mappers;

public static class StoryMapper
{
    public static StoryResponseDto ToResponseDto(
        this Story story,
        Guid currentUserId,
        IReadOnlyDictionary<Guid, AuthorSummaryDto> authors,
        ReactionType? currentUserReactionType,
        Func<string, string>? mediaUrlResolver = null)
    {
        ArgumentNullException.ThrowIfNull(story);
        ArgumentNullException.ThrowIfNull(authors);

        var resolvedMediaUrl = mediaUrlResolver is null
            ? story.MediaUrl
            : mediaUrlResolver(story.MediaUrl);

        var isViewedByCurrentUser = story.UserId == currentUserId || story.Views.Any(view => view.ViewerId == currentUserId);
        var viewCount = story.Views
            .Select(view => view.ViewerId)
            .Distinct()
            .Count();

        return new StoryResponseDto
        {
            Id = story.Id,
            UserId = story.UserId,
            Author = authors.TryGetValue(story.UserId, out var author)
                ? author
                : CreateFallbackAuthor(story.UserId),
            MediaUrl = resolvedMediaUrl,
            MediaType = story.MediaType,
            Content = story.Content,
            CreatedAt = story.CreatedAt,
            ExpiredAt = story.ExpiredAt,
            IsViewedByCurrentUser = isViewedByCurrentUser,
            CurrentUserReactionType = currentUserReactionType,
            ViewCount = viewCount
        };
    }

    public static List<StoryResponseDto> ToResponseDtos(
        this IReadOnlyList<Story> stories,
        Guid currentUserId,
        IReadOnlyDictionary<Guid, AuthorSummaryDto> authors,
        IReadOnlyDictionary<Guid, ReactionType>? currentUserReactions = null,
        Func<string, string>? mediaUrlResolver = null)
    {
        ArgumentNullException.ThrowIfNull(stories);
        ArgumentNullException.ThrowIfNull(authors);

        var effectiveReactions = currentUserReactions ?? EmptyReactions;

        return stories
            .Select(story => story.ToResponseDto(
                currentUserId,
                authors,
                effectiveReactions.TryGetValue(story.Id, out var reactionType) ? reactionType : null,
                mediaUrlResolver))
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

    private static readonly IReadOnlyDictionary<Guid, ReactionType> EmptyReactions = new Dictionary<Guid, ReactionType>();
}
