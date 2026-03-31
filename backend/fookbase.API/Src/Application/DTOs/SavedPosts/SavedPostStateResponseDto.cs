namespace InteractHub.Api.Application.DTOs.SavedPosts;

public class SavedPostStateResponseDto
{
    public Guid PostId { get; init; }

    public bool Saved { get; init; }

    public DateTime? SavedAt { get; init; }
}
