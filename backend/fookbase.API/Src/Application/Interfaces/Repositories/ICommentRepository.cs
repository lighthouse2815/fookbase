using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface ICommentRepository
{
    Task<(IReadOnlyList<Comment> Items, int TotalCount)> GetPagedByPostIdAsync(Guid postId, int page, int pageSize, CancellationToken cancellationToken);

    Task<Comment?> GetByIdAsync(Guid commentId, CancellationToken cancellationToken);

    Task AddAsync(Comment comment, CancellationToken cancellationToken);
}