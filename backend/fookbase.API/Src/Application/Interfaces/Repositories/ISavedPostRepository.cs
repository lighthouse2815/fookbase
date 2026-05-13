using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface ISavedPostRepository
{
    Task<(IReadOnlyList<SavedPost> Items, int TotalCount)> GetPagedByUserAsync(
        Guid userId,
        int page,
        int pageSize,
        Guid? viewerUserId,
        IReadOnlyCollection<Guid>? viewerFriendUserIds,
        CancellationToken cancellationToken,
        IReadOnlyCollection<Guid>? excludedPostOwnerUserIds = null);

    Task<SavedPost?> GetByUserAndPostAsync(Guid userId, Guid postId, CancellationToken cancellationToken);

    Task<SavedPost?> GetByUserAndPostForUpdateAsync(Guid userId, Guid postId, CancellationToken cancellationToken);

    Task AddAsync(SavedPost savedPost, CancellationToken cancellationToken);

    void Remove(SavedPost savedPost);
}



