using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.DTOs.Likes;

public class PostReactionStateResponseDto
{
    public Guid PostId { get; init; }

    public ReactionType? ReactionType { get; init; }

    public int ReactionCount { get; init; }

    public IReadOnlyList<ReactionType> TopReactionTypes { get; init; } = Array.Empty<ReactionType>();
}



