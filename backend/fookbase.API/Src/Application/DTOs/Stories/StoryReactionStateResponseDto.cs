namespace InteractHub.Api.Application.DTOs.Stories;

public class StoryReactionStateResponseDto
{
    public Guid StoryId { get; init; }

    public string? ReactionType { get; init; }
}
