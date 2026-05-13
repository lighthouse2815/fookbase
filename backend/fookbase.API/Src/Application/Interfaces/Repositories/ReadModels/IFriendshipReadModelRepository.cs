using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IFriendshipReadModelRepository
{
    Task<IReadOnlyList<Guid>> GetBlockedUserIdsAsync(
        Guid ownerUserId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<FriendshipReadModel>> GetFriendshipRelationsByOwnerAsync(
        Guid ownerUserId,
        CancellationToken cancellationToken);

    Task<FriendshipReadModel?> GetFriendshipRelationAsync(
        Guid ownerUserId,
        Guid otherUserId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Guid>> GetActiveContactIdsAsync(
        Guid ownerUserId,
        CancellationToken cancellationToken);
    
    void AddFriendshipRelation(FriendshipReadModel relation);

    Task<FriendshipReadModelSyncState?> GetSyncStateAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<FriendshipReadModelSyncState> GetOrCreateSyncStateAsync(
        Guid userId,
        CancellationToken cancellationToken);
}



