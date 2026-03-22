using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IStoryRepository
{
    Task<(IReadOnlyList<Story> Items, int TotalCount)> GetPagedActiveAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<(IReadOnlyList<Story> Items, int TotalCount)> GetPagedByUserIdAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken);

    Task<Story?> GetByIdAsync(Guid storyId, CancellationToken cancellationToken);

    Task<Story?> GetByIdForUpdateAsync(Guid storyId, CancellationToken cancellationToken);

    Task AddAsync(Story story, CancellationToken cancellationToken);
}