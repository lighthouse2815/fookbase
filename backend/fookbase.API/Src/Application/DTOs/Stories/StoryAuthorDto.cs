namespace InteractHub.Api.Application.DTOs.Stories;

public class StoryAuthorDto
{
    public Guid Id { get; init; }

    public string Username { get; init; } = "user";

    public string DisplayName { get; init; } = "user";

    public string AvatarUrl { get; init; } = string.Empty;
}
