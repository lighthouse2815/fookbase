using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Mappers;

public static class StoryReactionMapper
{
    public static StoryReactionStateResponseDto ToStateResponseDto(Guid storyId, ReactionType? reactionType)
    {
        return new StoryReactionStateResponseDto
        {
            StoryId = storyId,
            ReactionType = reactionType
        };
    }
}
