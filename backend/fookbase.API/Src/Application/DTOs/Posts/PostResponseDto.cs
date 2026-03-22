namespace InteractHub.Api.Application.DTOs.Posts;

public class PostResponseDto
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public string Content { get; init; } = string.Empty;

    public string? ImageUrl { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }

    public int LikeCount { get; init; }

    public int CommentCount { get; init; }

    public IReadOnlyList<string> Hashtags { get; init; } = Array.Empty<string>();
}