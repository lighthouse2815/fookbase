using InteractHub.Api.Application.DTOs.Common;

namespace InteractHub.Api.Application.DTOs.Posts;

public record PostResponseDto
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public AuthorSummaryDto Author { get; init; } = new();

    public string Content { get; init; } = string.Empty;

    public IReadOnlyList<string> ImageUrls { get; init; } = Array.Empty<string>();

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }

    public int LikeCount { get; init; }

    public bool LikedByCurrentUser { get; init; }

    public int ReactionCount { get; init; }

    public string? CurrentUserReactionType { get; init; }

    public IReadOnlyList<string> TopReactionTypes { get; init; } = Array.Empty<string>();

    public int CommentCount { get; init; }

    public IReadOnlyList<string> Hashtags { get; init; } = Array.Empty<string>();
}
