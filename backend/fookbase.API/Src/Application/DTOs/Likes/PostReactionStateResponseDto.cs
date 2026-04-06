namespace InteractHub.Api.Application.DTOs.Likes;

public class PostReactionStateResponseDto
{
    public Guid PostId { get; init; }

    public string? ReactionType { get; init; }

    public int ReactionCount { get; init; }

    public IReadOnlyList<string> TopReactionTypes { get; init; } = Array.Empty<string>();
}
