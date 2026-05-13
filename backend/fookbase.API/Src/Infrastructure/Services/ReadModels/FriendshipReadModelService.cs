using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Infrastructure.Services.ReadModels;

public class FriendshipReadModelService : IFriendshipReadModelService
{
    private readonly IFriendshipReadModelRepository _friendshipReadModelRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJavaFriendshipApiService _javaFriendshipApiService;
    private readonly ILogger<FriendshipReadModelService> _logger;

    public FriendshipReadModelService(
        IFriendshipReadModelRepository friendshipReadModelRepository,
        IUnitOfWork unitOfWork,
        IJavaFriendshipApiService javaFriendshipApiService,
        ILogger<FriendshipReadModelService> logger)
    {
        _friendshipReadModelRepository = friendshipReadModelRepository;
        _unitOfWork = unitOfWork;
        _javaFriendshipApiService = javaFriendshipApiService;
        _logger = logger;
    }

    public async Task<HashSet<Guid>> ResolveBlockedUserIdsAsync(
        Guid? ownerUserId,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null)
    {
        if (!ownerUserId.HasValue || ownerUserId.Value == Guid.Empty)
        {
            return new HashSet<Guid>();
        }

        var ownerId = ownerUserId.Value;
        var localBlockedUserIds = await _friendshipReadModelRepository.GetBlockedUserIdsAsync(ownerId, cancellationToken);

        var syncState = await _friendshipReadModelRepository.GetSyncStateAsync(ownerId, cancellationToken);

        if (!requireFresh && syncState?.LastBlockedSnapshotAtUtc is not null)
        {
            return localBlockedUserIds.ToHashSet();
        }

        var blockedResult = await FetchBlockedUserIdsFromJavaAsync(ownerId, accessToken, cancellationToken);
        if (blockedResult is null)
        {
            return localBlockedUserIds.ToHashSet();
        }

        await ApplyBlockedSnapshotAsync(ownerId, blockedResult.Value.BlockedUserIds, blockedResult.Value.SnapshotAtUtc, cancellationToken);
        return blockedResult.Value.BlockedUserIds;
    }

    public async Task<Dictionary<Guid, DateTime>> ResolveBlockedUsersAsync(
        Guid ownerUserId,
        string? accessToken,
        CancellationToken cancellationToken,
        bool requireFresh = false)
    {
        if (ownerUserId == Guid.Empty)
        {
            return new Dictionary<Guid, DateTime>();
        }

        await ResolveBlockedUserIdsAsync(
            ownerUserId,
            cancellationToken,
            requireFresh,
            accessToken);

        var relations = await _friendshipReadModelRepository.GetFriendshipRelationsByOwnerAsync(ownerUserId, cancellationToken);
        return FriendshipReadModelMapper.ToBlockedUsersLookup(relations);
    }

    public async Task<HashSet<Guid>> ResolveContactIdsAsync(
        Guid ownerUserId,
        string? accessToken,
        CancellationToken cancellationToken,
        bool requireFresh = false)
    {
        if (ownerUserId == Guid.Empty)
        {
            return new HashSet<Guid>();
        }

        var localContactIds = await _friendshipReadModelRepository.GetActiveContactIdsAsync(ownerUserId, cancellationToken);

        var syncState = await _friendshipReadModelRepository.GetSyncStateAsync(ownerUserId, cancellationToken);

        if (!requireFresh && syncState?.LastContactSnapshotAtUtc is not null)
        {
            return localContactIds.ToHashSet();
        }

        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return localContactIds.ToHashSet();
        }

        var contactsResult = await FetchContactIdsFromJavaAsync(ownerUserId, accessToken, cancellationToken);
        if (contactsResult is null)
        {
            return localContactIds.ToHashSet();
        }

        await ApplyContactSnapshotAsync(ownerUserId, contactsResult.Value.ContactUserIds, contactsResult.Value.SnapshotAtUtc, cancellationToken);
        return contactsResult.Value.ContactUserIds;
    }

    public async Task SetBlockedRelationAsync(
        Guid ownerUserId,
        Guid blockedUserId,
        bool isBlocked,
        DateTime? observedAtUtc,
        CancellationToken cancellationToken)
    {
        if (ownerUserId == Guid.Empty || blockedUserId == Guid.Empty || ownerUserId == blockedUserId)
        {
            return;
        }

        var now = ReadModelHelper.NormalizeObservedAtUtc(observedAtUtc);
        var relation = await _friendshipReadModelRepository.GetFriendshipRelationAsync(ownerUserId, blockedUserId, cancellationToken);

        if (relation is null)
        {
            if (isBlocked)
            {
                relation = new FriendshipReadModel
                {
                    OwnerUserId = ownerUserId,
                    OtherUserId = blockedUserId,
                    Status = FriendshipStatus.BLOCKED,
                    UpdatedAtUtc = now
                };
                _friendshipReadModelRepository.AddFriendshipRelation(relation);
            }
        }
        else
        {
            relation.Status = isBlocked
                ? FriendshipStatus.BLOCKED
                : relation.Status == FriendshipStatus.BLOCKED
                    ? FriendshipStatus.REMOVED
                    : relation.Status;
            relation.UpdatedAtUtc = now;
        }

        var syncState = await _friendshipReadModelRepository.GetOrCreateSyncStateAsync(ownerUserId, cancellationToken);
        syncState.LastBlockedSnapshotAtUtc = now;
        syncState.UpdatedAtUtc = now;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task SetFriendshipAsync(
        Guid firstUserId,
        Guid secondUserId,
        bool isActive,
        DateTime? observedAtUtc,
        CancellationToken cancellationToken)
    {
        if (firstUserId == Guid.Empty || secondUserId == Guid.Empty || firstUserId == secondUserId)
        {
            return;
        }

        var now = ReadModelHelper.NormalizeObservedAtUtc(observedAtUtc);
        var targetStatus = isActive ? FriendshipStatus.ACCEPTED : FriendshipStatus.REMOVED;

        await SetFriendshipStatusInternalAsync(firstUserId, secondUserId, targetStatus, now, cancellationToken);
        await SetFriendshipStatusInternalAsync(secondUserId, firstUserId, targetStatus, now, cancellationToken);

        var firstSync = await _friendshipReadModelRepository.GetOrCreateSyncStateAsync(firstUserId, cancellationToken);
        firstSync.LastContactSnapshotAtUtc = now;
        firstSync.UpdatedAtUtc = now;

        var secondSync = await _friendshipReadModelRepository.GetOrCreateSyncStateAsync(secondUserId, cancellationToken);
        secondSync.LastContactSnapshotAtUtc = now;
        secondSync.UpdatedAtUtc = now;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task SetFriendshipStatusInternalAsync(
        Guid ownerUserId,
        Guid otherUserId,
        FriendshipStatus targetStatus,
        DateTime observedAtUtc,
        CancellationToken cancellationToken)
    {
        var relation = await _friendshipReadModelRepository.GetFriendshipRelationAsync(ownerUserId, otherUserId, cancellationToken);

        if (relation is null)
        {
            relation = new FriendshipReadModel
            {
                OwnerUserId = ownerUserId,
                OtherUserId = otherUserId,
                Status = targetStatus,
                UpdatedAtUtc = observedAtUtc
            };
            _friendshipReadModelRepository.AddFriendshipRelation(relation);
            return;
        }

        if (relation.Status != FriendshipStatus.BLOCKED)
        {
            relation.Status = targetStatus;
        }

        relation.UpdatedAtUtc = observedAtUtc;
    }

    private async Task ApplyBlockedSnapshotAsync(
        Guid ownerUserId,
        HashSet<Guid> blockedUserIds,
        DateTime snapshotAtUtc,
        CancellationToken cancellationToken)
    {
        var existingRelations = await _friendshipReadModelRepository.GetFriendshipRelationsByOwnerAsync(ownerUserId, cancellationToken);
        var existingByOtherUserId = existingRelations.ToDictionary(relation => relation.OtherUserId, relation => relation);

        foreach (var relation in existingRelations)
        {
            if (relation.Status == FriendshipStatus.BLOCKED && !blockedUserIds.Contains(relation.OtherUserId))
            {
                relation.Status = FriendshipStatus.REMOVED;
                relation.UpdatedAtUtc = snapshotAtUtc;
            }
        }

        foreach (var blockedUserId in blockedUserIds)
        {
            if (existingByOtherUserId.TryGetValue(blockedUserId, out var existingRelation))
            {
                existingRelation.Status = FriendshipStatus.BLOCKED;
                existingRelation.UpdatedAtUtc = snapshotAtUtc;
                continue;
            }

            _friendshipReadModelRepository.AddFriendshipRelation(new FriendshipReadModel
            {
                OwnerUserId = ownerUserId,
                OtherUserId = blockedUserId,
                Status = FriendshipStatus.BLOCKED,
                UpdatedAtUtc = snapshotAtUtc
            });
        }

        var syncState = await _friendshipReadModelRepository.GetOrCreateSyncStateAsync(ownerUserId, cancellationToken);
        syncState.LastBlockedSnapshotAtUtc = snapshotAtUtc;
        syncState.UpdatedAtUtc = snapshotAtUtc;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task ApplyContactSnapshotAsync(
        Guid ownerUserId,
        HashSet<Guid> contactUserIds,
        DateTime snapshotAtUtc,
        CancellationToken cancellationToken)
    {
        var existingRelations = await _friendshipReadModelRepository.GetFriendshipRelationsByOwnerAsync(ownerUserId, cancellationToken);
        var existingByOtherUserId = existingRelations.ToDictionary(relation => relation.OtherUserId, relation => relation);

        foreach (var relation in existingRelations)
        {
            if (relation.Status == FriendshipStatus.ACCEPTED && !contactUserIds.Contains(relation.OtherUserId))
            {
                relation.Status = FriendshipStatus.REMOVED;
                relation.UpdatedAtUtc = snapshotAtUtc;
            }
            else if (relation.Status == FriendshipStatus.ACCEPTED && contactUserIds.Contains(relation.OtherUserId))
            {
                relation.UpdatedAtUtc = snapshotAtUtc;
            }
        }

        foreach (var contactUserId in contactUserIds)
        {
            if (existingByOtherUserId.TryGetValue(contactUserId, out var existingRelation))
            {
                if (existingRelation.Status != FriendshipStatus.BLOCKED)
                {
                    existingRelation.Status = FriendshipStatus.ACCEPTED;
                    existingRelation.UpdatedAtUtc = snapshotAtUtc;
                }

                continue;
            }

            _friendshipReadModelRepository.AddFriendshipRelation(new FriendshipReadModel
            {
                OwnerUserId = ownerUserId,
                OtherUserId = contactUserId,
                Status = FriendshipStatus.ACCEPTED,
                UpdatedAtUtc = snapshotAtUtc
            });
        }

        var syncState = await _friendshipReadModelRepository.GetOrCreateSyncStateAsync(ownerUserId, cancellationToken);
        syncState.LastContactSnapshotAtUtc = snapshotAtUtc;
        syncState.UpdatedAtUtc = snapshotAtUtc;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<(HashSet<Guid> BlockedUserIds, DateTime SnapshotAtUtc)?> FetchBlockedUserIdsFromJavaAsync(
        Guid ownerUserId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _javaFriendshipApiService.GetBlockedUserIdsAsync(accessToken ?? string.Empty, cancellationToken);
            if (!result.IsSuccess || result.Data is null)
            {
                return null;
            }

            var blockedUserIds = FriendshipReadModelMapper.ToBlockedUserIds(result.Data, ownerUserId);

            return (blockedUserIds, DateTime.UtcNow);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not refresh blocked-user snapshot for user {OwnerUserId}.",
                ownerUserId);
            return null;
        }
    }

    private async Task<(HashSet<Guid> ContactUserIds, DateTime SnapshotAtUtc)?> FetchContactIdsFromJavaAsync(
        Guid ownerUserId,
        string accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _javaFriendshipApiService.GetContactsByUserAsync(accessToken, cancellationToken);
            if (!result.IsSuccess || result.Data is null)
            {
                return null;
            }

            var contactUserIds = FriendshipReadModelMapper.ToContactUserIds(result.Data, ownerUserId);

            return (contactUserIds, DateTime.UtcNow);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not refresh contact snapshot for user {OwnerUserId}.",
                ownerUserId);
            return null;
        }
    }
}

