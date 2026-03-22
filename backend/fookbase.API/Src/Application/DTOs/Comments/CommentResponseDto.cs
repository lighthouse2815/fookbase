namespace InteractHub.Api.Application.DTOs.Comments;

public class CommentResponseDto
{
    public Guid Id { get; init; }

    public Guid PostId { get; init; }

    public Guid UserId { get; init; }

    public string Content { get; init; } = string.Empty;

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }
}