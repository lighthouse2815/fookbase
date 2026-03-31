using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IStoryRepository
{
    Task<(IReadOnlyList<Story> Items, int TotalCount)> GetPagedFeedAsync(
        IReadOnlyCollection<Guid> userIds,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<Story> Items, int TotalCount)> GetPagedActiveByUserIdAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<Story?> GetByIdAsync(Guid storyId, CancellationToken cancellationToken);

    Task<Story?> GetByIdForUpdateAsync(Guid storyId, CancellationToken cancellationToken);

    Task<bool> HasViewAsync(Guid storyId, Guid viewerId, CancellationToken cancellationToken);

    Task AddAsync(Story story, CancellationToken cancellationToken);

    Task AddViewAsync(StoryView storyView, CancellationToken cancellationToken);
}
