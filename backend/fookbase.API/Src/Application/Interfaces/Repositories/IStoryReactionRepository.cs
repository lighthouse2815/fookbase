using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IStoryReactionRepository
{
    Task<StoryReaction?> GetByStoryAndUserAsync(Guid storyId, Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<StoryReaction>> GetByStoryIdsAndUserAsync(
        IReadOnlyCollection<Guid> storyIds,
        Guid userId,
        CancellationToken cancellationToken);

    Task AddAsync(StoryReaction reaction, CancellationToken cancellationToken);

    void Remove(StoryReaction reaction);
}
