using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface ILikeRepository
{
    Task<Like?> GetByPostAndUserAsync(Guid postId, Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Like>> GetByPostIdAsync(Guid postId, CancellationToken cancellationToken);

    Task<int> CountByPostIdAsync(Guid postId, CancellationToken cancellationToken);

    Task AddAsync(Like like, CancellationToken cancellationToken);

    void Remove(Like like);
}
