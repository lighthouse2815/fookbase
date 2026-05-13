using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.DTOs.Stories;

public class StoryResponseDto
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public AuthorSummaryDto Author { get; init; } = new();

    public string MediaUrl { get; init; } = string.Empty;

    public MediaType MediaType { get; init; }

    public string? Content { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime ExpiredAt { get; init; }

    public bool IsViewedByCurrentUser { get; init; }

    public ReactionType? CurrentUserReactionType { get; init; }

    public int ViewCount { get; init; }
}



