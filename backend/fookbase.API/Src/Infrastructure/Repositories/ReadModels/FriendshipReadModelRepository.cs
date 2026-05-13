using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class FriendshipReadModelRepository : IFriendshipReadModelRepository
{
    private readonly AppDbContext _context;

    public FriendshipReadModelRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Guid>> GetBlockedUserIdsAsync(Guid ownerUserId, CancellationToken cancellationToken)
    {
        return await _context.FriendshipReadModels
            .Where(relation =>
                relation.OwnerUserId == ownerUserId
                && relation.Status == Domain.Enums.FriendshipStatus.BLOCKED)
            .Select(relation => relation.OtherUserId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<FriendshipReadModel>> GetFriendshipRelationsByOwnerAsync(
        Guid ownerUserId,
        CancellationToken cancellationToken)
    {
        return await _context.FriendshipReadModels
            .Where(relation => relation.OwnerUserId == ownerUserId)
            .ToListAsync(cancellationToken);
    }

    public Task<FriendshipReadModel?> GetFriendshipRelationAsync(
        Guid ownerUserId,
        Guid otherUserId,
        CancellationToken cancellationToken)
    {
        return _context.FriendshipReadModels
            .FirstOrDefaultAsync(
                relation => relation.OwnerUserId == ownerUserId && relation.OtherUserId == otherUserId,
                cancellationToken);
    }

    public void AddFriendshipRelation(FriendshipReadModel relation)
    {
        _context.FriendshipReadModels.Add(relation);
    }

    public async Task<IReadOnlyList<Guid>> GetActiveContactIdsAsync(Guid ownerUserId, CancellationToken cancellationToken)
    {
        return await _context.FriendshipReadModels
            .Where(relation =>
                relation.OwnerUserId == ownerUserId
                && relation.Status == Domain.Enums.FriendshipStatus.ACCEPTED)
            .Select(relation => relation.OtherUserId)
            .ToListAsync(cancellationToken);
    }

    public Task<FriendshipReadModelSyncState?> GetSyncStateAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _context.FriendshipReadModelSyncStates
            .FirstOrDefaultAsync(state => state.UserId == userId, cancellationToken);
    }

    public async Task<FriendshipReadModelSyncState> GetOrCreateSyncStateAsync(Guid userId, CancellationToken cancellationToken)
    {
        var syncState = await GetSyncStateAsync(userId, cancellationToken);
        if (syncState is not null)
        {
            return syncState;
        }

        syncState = new FriendshipReadModelSyncState
        {
            UserId = userId,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.FriendshipReadModelSyncStates.Add(syncState);
        return syncState;
    }
}



