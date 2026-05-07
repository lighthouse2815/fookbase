using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Infrastructure.Services;

public class UserReadModelService : IUserReadModelService, IUserReadModelProjector
{
    private readonly AppDbContext _dbContext;
    private readonly IJavaApiService _javaApiService;
    private readonly ILogger<UserReadModelService> _logger;
    private readonly UserReadModelOptions _options;

    public UserReadModelService(
        AppDbContext dbContext,
        IJavaApiService javaApiService,
        IOptions<UserReadModelOptions> optionsAccessor,
        ILogger<UserReadModelService> logger)
    {
        _dbContext = dbContext;
        _javaApiService = javaApiService;
        _options = optionsAccessor.Value;
        _logger = logger;
    }

    public async Task<AuthorSummaryDto> ResolveAuthorAsync(
        Guid userId,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null,
        string fallbackDisplayName = "user")
    {
        var profiles = await ResolveProfileLookupAsync(
            [userId],
            cancellationToken,
            requireFresh,
            accessToken);

        var profile = profiles.TryGetValue(userId, out var value) ? value : null;
        return ToAuthorSummary(userId, profile, fallbackDisplayName);
    }

    public async Task<Dictionary<Guid, AuthorSummaryDto>> ResolveAuthorsAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null,
        string fallbackDisplayName = "user")
    {
        var distinctUserIds = userIds
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList();

        if (distinctUserIds.Count == 0)
        {
            return new Dictionary<Guid, AuthorSummaryDto>();
        }

        var profiles = await ResolveProfileLookupAsync(
            distinctUserIds,
            cancellationToken,
            requireFresh,
            accessToken);

        return distinctUserIds.ToDictionary(
            userId => userId,
            userId =>
            {
                var profile = profiles.TryGetValue(userId, out var value) ? value : null;
                return ToAuthorSummary(userId, profile, fallbackDisplayName);
            });
    }

    public async Task<Dictionary<Guid, UserProfileSummaryDto?>> ResolveProfileLookupAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null)
    {
        var distinctUserIds = userIds
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList();

        if (distinctUserIds.Count == 0)
        {
            return new Dictionary<Guid, UserProfileSummaryDto?>();
        }

        var cachedEntities = await _dbContext.UserProfileReadModels
            .Where(profile => distinctUserIds.Contains(profile.UserId))
            .ToDictionaryAsync(profile => profile.UserId, cancellationToken);

        var result = cachedEntities.ToDictionary(
            item => item.Key,
            item => (UserProfileSummaryDto?)ToProfileSummary(item.Value));

        var profileCacheTtl = ResolveProfileCacheTtl(_options.ProfileCacheTtlSeconds);
        var idsToRefresh = requireFresh
            ? distinctUserIds
            : distinctUserIds.Where(userId =>
                !cachedEntities.TryGetValue(userId, out var cachedEntity)
                || IsProfileEntryStale(cachedEntity, profileCacheTtl)).ToList();

        if (idsToRefresh.Count == 0)
        {
            return result;
        }

        var updated = false;
        var fetchTasks = idsToRefresh.Select(async userId =>
        {
            var profile = await FetchProfileFromJavaAsync(userId, cancellationToken, accessToken);
            return new KeyValuePair<Guid, UserProfileSummaryDto?>(userId, profile);
        });

        var fetchedProfiles = await Task.WhenAll(fetchTasks);
        foreach (var (userId, profile) in fetchedProfiles)
        {
            result[userId] = profile;
            if (profile is null)
            {
                continue;
            }

            if (!cachedEntities.TryGetValue(userId, out var entity))
            {
                entity = new UserProfileReadModel
                {
                    UserId = userId
                };
                _dbContext.UserProfileReadModels.Add(entity);
                cachedEntities[userId] = entity;
            }

            entity.DisplayName = profile.DisplayName.TrimToNull() ?? "user";
            entity.AvatarUrl = profile.AvatarUrl.TrimToNull() ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId);
            entity.UpdatedAtUtc = DateTime.UtcNow;
            updated = true;
        }

        if (updated)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return result;
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
        var localBlockedUserIds = await _dbContext.UserBlockRelationReadModels
            .Where(relation => relation.OwnerUserId == ownerId && relation.IsBlocked)
            .Select(relation => relation.BlockedUserId)
            .ToListAsync(cancellationToken);

        var syncState = await _dbContext.UserReadModelSyncStates
            .FirstOrDefaultAsync(state => state.UserId == ownerId, cancellationToken);

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

        var localContactIds = await _dbContext.UserContactReadModels
            .Where(relation => relation.OwnerUserId == ownerUserId && relation.IsActive)
            .Select(relation => relation.ContactUserId)
            .ToListAsync(cancellationToken);

        var syncState = await _dbContext.UserReadModelSyncStates
            .FirstOrDefaultAsync(state => state.UserId == ownerUserId, cancellationToken);

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

    public async Task UpsertProfileAsync(
        Guid userId,
        string? displayName,
        string? avatarUrl,
        DateTime? observedAtUtc,
        CancellationToken cancellationToken)
    {
        if (userId == Guid.Empty)
        {
            return;
        }

        var now = NormalizeObservedAtUtc(observedAtUtc);
        var entity = await _dbContext.UserProfileReadModels
            .FirstOrDefaultAsync(profile => profile.UserId == userId, cancellationToken);

        if (entity is null)
        {
            entity = new UserProfileReadModel
            {
                UserId = userId
            };
            _dbContext.UserProfileReadModels.Add(entity);
        }

        entity.DisplayName = displayName.TrimToNull() ?? "user";
        entity.AvatarUrl = avatarUrl.TrimToNull() ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId);
        entity.UpdatedAtUtc = now;

        await _dbContext.SaveChangesAsync(cancellationToken);
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

        var now = NormalizeObservedAtUtc(observedAtUtc);
        var relation = await _dbContext.UserBlockRelationReadModels
            .FirstOrDefaultAsync(
                item => item.OwnerUserId == ownerUserId && item.BlockedUserId == blockedUserId,
                cancellationToken);

        if (relation is null)
        {
            relation = new UserBlockRelationReadModel
            {
                OwnerUserId = ownerUserId,
                BlockedUserId = blockedUserId
            };
            _dbContext.UserBlockRelationReadModels.Add(relation);
        }

        relation.IsBlocked = isBlocked;
        relation.UpdatedAtUtc = now;

        var syncState = await GetOrCreateSyncStateAsync(ownerUserId, cancellationToken);
        syncState.LastBlockedSnapshotAtUtc = now;
        syncState.UpdatedAtUtc = now;

        await _dbContext.SaveChangesAsync(cancellationToken);
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

        var now = NormalizeObservedAtUtc(observedAtUtc);

        await SetContactRelationInternalAsync(firstUserId, secondUserId, isActive, now, cancellationToken);
        await SetContactRelationInternalAsync(secondUserId, firstUserId, isActive, now, cancellationToken);

        var firstSync = await GetOrCreateSyncStateAsync(firstUserId, cancellationToken);
        firstSync.LastContactSnapshotAtUtc = now;
        firstSync.UpdatedAtUtc = now;

        var secondSync = await GetOrCreateSyncStateAsync(secondUserId, cancellationToken);
        secondSync.LastContactSnapshotAtUtc = now;
        secondSync.UpdatedAtUtc = now;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SetContactRelationInternalAsync(
        Guid ownerUserId,
        Guid contactUserId,
        bool isActive,
        DateTime observedAtUtc,
        CancellationToken cancellationToken)
    {
        var relation = await _dbContext.UserContactReadModels
            .FirstOrDefaultAsync(
                item => item.OwnerUserId == ownerUserId && item.ContactUserId == contactUserId,
                cancellationToken);

        if (relation is null)
        {
            relation = new UserContactReadModel
            {
                OwnerUserId = ownerUserId,
                ContactUserId = contactUserId
            };
            _dbContext.UserContactReadModels.Add(relation);
        }

        relation.IsActive = isActive;
        relation.UpdatedAtUtc = observedAtUtc;
    }

    private async Task ApplyBlockedSnapshotAsync(
        Guid ownerUserId,
        HashSet<Guid> blockedUserIds,
        DateTime snapshotAtUtc,
        CancellationToken cancellationToken)
    {
        var existingRelations = await _dbContext.UserBlockRelationReadModels
            .Where(relation => relation.OwnerUserId == ownerUserId)
            .ToListAsync(cancellationToken);

        var existingByBlockedUserId = existingRelations.ToDictionary(relation => relation.BlockedUserId, relation => relation);
        foreach (var relation in existingRelations)
        {
            relation.IsBlocked = blockedUserIds.Contains(relation.BlockedUserId);
            relation.UpdatedAtUtc = snapshotAtUtc;
        }

        foreach (var blockedUserId in blockedUserIds)
        {
            if (existingByBlockedUserId.ContainsKey(blockedUserId))
            {
                continue;
            }

            _dbContext.UserBlockRelationReadModels.Add(new UserBlockRelationReadModel
            {
                OwnerUserId = ownerUserId,
                BlockedUserId = blockedUserId,
                IsBlocked = true,
                UpdatedAtUtc = snapshotAtUtc
            });
        }

        var syncState = await GetOrCreateSyncStateAsync(ownerUserId, cancellationToken);
        syncState.LastBlockedSnapshotAtUtc = snapshotAtUtc;
        syncState.UpdatedAtUtc = snapshotAtUtc;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task ApplyContactSnapshotAsync(
        Guid ownerUserId,
        HashSet<Guid> contactUserIds,
        DateTime snapshotAtUtc,
        CancellationToken cancellationToken)
    {
        var existingRelations = await _dbContext.UserContactReadModels
            .Where(relation => relation.OwnerUserId == ownerUserId)
            .ToListAsync(cancellationToken);

        var existingByContactUserId = existingRelations.ToDictionary(relation => relation.ContactUserId, relation => relation);
        foreach (var relation in existingRelations)
        {
            relation.IsActive = contactUserIds.Contains(relation.ContactUserId);
            relation.UpdatedAtUtc = snapshotAtUtc;
        }

        foreach (var contactUserId in contactUserIds)
        {
            if (existingByContactUserId.ContainsKey(contactUserId))
            {
                continue;
            }

            _dbContext.UserContactReadModels.Add(new UserContactReadModel
            {
                OwnerUserId = ownerUserId,
                ContactUserId = contactUserId,
                IsActive = true,
                UpdatedAtUtc = snapshotAtUtc
            });
        }

        var syncState = await GetOrCreateSyncStateAsync(ownerUserId, cancellationToken);
        syncState.LastContactSnapshotAtUtc = snapshotAtUtc;
        syncState.UpdatedAtUtc = snapshotAtUtc;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<(HashSet<Guid> BlockedUserIds, DateTime SnapshotAtUtc)?> FetchBlockedUserIdsFromJavaAsync(
        Guid ownerUserId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _javaApiService.GetBlockedUserIdsAsync(accessToken ?? string.Empty, cancellationToken);
            if (!result.IsSuccess || result.Data is null)
            {
                return null;
            }

            var blockedUserIds = result.Data
                .Where(userId => !string.IsNullOrWhiteSpace(userId))
                .Select(userId => Guid.TryParse(userId, out var parsedUserId) ? parsedUserId : (Guid?)null)
                .Where(parsedUserId => parsedUserId.HasValue && parsedUserId.Value != ownerUserId)
                .Select(parsedUserId => parsedUserId!.Value)
                .ToHashSet();

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
            var result = await _javaApiService.GetContactsByUserAsync(accessToken, cancellationToken);
            if (!result.IsSuccess || result.Data is null)
            {
                return null;
            }

            var contactUserIds = result.Data
                .Where(contact => !string.IsNullOrWhiteSpace(contact.UserId))
                .Select(contact => Guid.TryParse(contact.UserId, out var parsedUserId) ? parsedUserId : (Guid?)null)
                .Where(parsedUserId => parsedUserId.HasValue && parsedUserId.Value != ownerUserId)
                .Select(parsedUserId => parsedUserId!.Value)
                .ToHashSet();

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

    private async Task<UserProfileSummaryDto?> FetchProfileFromJavaAsync(
        Guid userId,
        CancellationToken cancellationToken,
        string? accessToken)
    {
        try
        {
            return await _javaApiService.GetProfileSummaryByUserId(
                userId,
                cancellationToken: cancellationToken,
                accessToken: accessToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not refresh profile summary for user {UserId}.",
                userId);
            return null;
        }
    }

    private async Task<UserReadModelSyncState> GetOrCreateSyncStateAsync(Guid ownerUserId, CancellationToken cancellationToken)
    {
        var state = await _dbContext.UserReadModelSyncStates
            .FirstOrDefaultAsync(item => item.UserId == ownerUserId, cancellationToken);

        if (state is not null)
        {
            return state;
        }

        state = new UserReadModelSyncState
        {
            UserId = ownerUserId,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _dbContext.UserReadModelSyncStates.Add(state);
        return state;
    }

    private static AuthorSummaryDto ToAuthorSummary(
        Guid userId,
        UserProfileSummaryDto? profile,
        string fallbackDisplayName)
    {
        var displayName = profile?.DisplayName.TrimToNull() ?? fallbackDisplayName;
        var avatarUrl = profile?.AvatarUrl.TrimToNull() ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId);

        return new AuthorSummaryDto
        {
            Id = userId,
            DisplayName = displayName,
            AvatarUrl = avatarUrl
        };
    }

    private static UserProfileSummaryDto ToProfileSummary(UserProfileReadModel profile)
    {
        return new UserProfileSummaryDto
        {
            UserId = profile.UserId,
            DisplayName = profile.DisplayName,
            AvatarUrl = profile.AvatarUrl
        };
    }

    private static DateTime NormalizeObservedAtUtc(DateTime? observedAtUtc)
    {
        if (!observedAtUtc.HasValue)
        {
            return DateTime.UtcNow;
        }

        return observedAtUtc.Value.Kind == DateTimeKind.Utc
            ? observedAtUtc.Value
            : observedAtUtc.Value.ToUniversalTime();
    }

    private static TimeSpan ResolveProfileCacheTtl(int ttlSeconds)
    {
        if (ttlSeconds <= 0)
        {
            return TimeSpan.Zero;
        }

        return TimeSpan.FromSeconds(Math.Min(ttlSeconds, 86400));
    }

    private static bool IsProfileEntryStale(UserProfileReadModel profile, TimeSpan profileCacheTtl)
    {
        if (profileCacheTtl == TimeSpan.Zero)
        {
            return true;
        }

        return DateTime.UtcNow - profile.UpdatedAtUtc >= profileCacheTtl;
    }
}
