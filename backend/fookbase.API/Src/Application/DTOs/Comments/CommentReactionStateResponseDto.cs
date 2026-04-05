namespace InteractHub.Api.Application.DTOs.Comments;

public class CommentReactionStateResponseDto
{
    public Guid CommentId { get; init; }

    public string? ReactionType { get; init; }
}
