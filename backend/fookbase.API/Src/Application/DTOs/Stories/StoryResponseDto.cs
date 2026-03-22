namespace InteractHub.Api.Application.DTOs.Stories;

public class StoryResponseDto
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public string MediaUrl { get; init; } = string.Empty;

    public DateTime ExpiresAt { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }

    public bool IsExpired { get; init; }
}