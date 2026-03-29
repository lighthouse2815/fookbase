namespace InteractHub.Api.Application.DTOs.Comments;

public class CommentAuthorDto
{
    public Guid Id { get; init; }

    public string Username { get; init; } = "user";

    public string DisplayName { get; init; } = "user";

    public string? AvatarUrl { get; init; }
}
