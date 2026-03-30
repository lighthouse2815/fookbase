namespace InteractHub.Api.Application.DTOs.Posts;

public record PostResponseDto
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public PostAuthorDto Author { get; init; } = new();

    public string Content { get; init; } = string.Empty;

    public string? ImageUrl { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }

    public int LikeCount { get; init; }

    public bool LikedByCurrentUser { get; init; }

    public int CommentCount { get; init; }

    public IReadOnlyList<string> Hashtags { get; init; } = Array.Empty<string>();
}
