namespace InteractHub.Api.Application.DTOs.Comments;

public record CommentReactionUserDto
{
    public Guid UserId { get; init; }

    public string DisplayName { get; init; } = "user";

    public string AvatarUrl { get; init; } = string.Empty;

    public string ReactionType { get; init; } = string.Empty;

    public DateTime ReactedAt { get; init; }
}
