using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.DTOs.Stories;

public class StoryReactionStateResponseDto
{
    public Guid StoryId { get; init; }

    public ReactionType? ReactionType { get; init; }
}



