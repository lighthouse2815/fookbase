using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IPostRepository
{
    Task<(IReadOnlyList<Post> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<Post?> GetByIdAsync(Guid postId, CancellationToken cancellationToken);

    Task<Post?> GetByIdForUpdateAsync(Guid postId, CancellationToken cancellationToken);

    Task AddAsync(Post post, CancellationToken cancellationToken);
}