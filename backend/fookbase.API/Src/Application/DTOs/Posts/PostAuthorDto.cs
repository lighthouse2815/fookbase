namespace InteractHub.Api.Application.DTOs.Posts;

public class PostAuthorDto
{
    public Guid Id { get; init; }

    public string Username { get; init; } = "user";

    public string DisplayName { get; init; } = "user";

    public string? AvatarUrl { get; init; }
}
