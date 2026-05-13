using InteractHub.Api.Application.DTOs.Common;

namespace InteractHub.Api.Application.DTOs.Posts;

public record SharedPostReferenceDto
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public AuthorSummaryDto Author { get; init; } = new();

    public string Content { get; init; } = string.Empty;

    public IReadOnlyList<string> ImageUrls { get; init; } = Array.Empty<string>();

    public DateTime CreatedAt { get; init; }

    public int ReactionCount { get; init; }

    public int CommentCount { get; init; }
}
