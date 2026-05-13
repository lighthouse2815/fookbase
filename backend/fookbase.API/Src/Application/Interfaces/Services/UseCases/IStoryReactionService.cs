using InteractHub.Api.Application.DTOs.Stories;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IStoryReactionService
{
    Task<StoryReactionStateResponseDto> SetReactionAsync(
        Guid storyId,
        Guid userId,
        SetStoryReactionRequestDto request,
        CancellationToken cancellationToken);

    Task<StoryReactionStateResponseDto> RemoveReactionAsync(
        Guid storyId,
        Guid userId,
        CancellationToken cancellationToken);
}



