using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.DTOs.Comments;

public class CommentReactionStateResponseDto
{
    public Guid CommentId { get; init; }

    public ReactionType? ReactionType { get; init; }
}



