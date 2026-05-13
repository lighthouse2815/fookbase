using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Infrastructure.Services.ReadModels;

public class UserProfileSummaryReadModelService : IUserProfileSummaryReadModelService
{
    private readonly IUserProfileSummaryReadModelRepository _userProfileSummaryReadModelRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJavaUserProfileApiService _javaUserProfileApiService;
    private readonly UserReadModelOptions _options;
    private readonly ILogger<UserProfileSummaryReadModelService> _logger;

    public UserProfileSummaryReadModelService(
        IUserProfileSummaryReadModelRepository userProfileSummaryReadModelRepository,
        IUnitOfWork unitOfWork,
        IJavaUserProfileApiService javaUserProfileApiService,
        IOptions<UserReadModelOptions> optionsAccessor,
        ILogger<UserProfileSummaryReadModelService> logger)
    {
        _userProfileSummaryReadModelRepository = userProfileSummaryReadModelRepository;
        _unitOfWork = unitOfWork;
        _javaUserProfileApiService = javaUserProfileApiService;
        _options = optionsAccessor.Value;
        _logger = logger;
    }

    public async Task<Dictionary<Guid, UserProfileSummaryDto?>> GetProfileSummariesAsync(
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

        var cachedEntities = await _userProfileSummaryReadModelRepository
            .GetByUserIdsAsync(distinctUserIds, cancellationToken);

        var result = cachedEntities.ToDictionary(
            item => item.Key,
            item => (UserProfileSummaryDto?)UserProfileSummaryReadModelMapper.ToProfileSummary(item.Value));

        var profileCacheTtl = ResolveProfileCacheTtl(_options.ProfileCacheTtlSeconds);
        var idsToRefresh = ResolveProfileIdsToRefresh(
            distinctUserIds,
            cachedEntities,
            profileCacheTtl,
            requireFresh);

        if (idsToRefresh.Count == 0)
        {
            return result;
        }

        var updated = await RefreshProfilesAsync(
            idsToRefresh,
            result,
            cachedEntities,
            cancellationToken,
            accessToken);

        if (updated)
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return result;
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

        var now = ReadModelHelper.NormalizeObservedAtUtc(observedAtUtc);
        var entity = await _userProfileSummaryReadModelRepository.GetByUserIdAsync(userId, cancellationToken);

        if (entity is null)
        {
            entity = new UserProfileSummaryReadModel
            {
                UserId = userId
            };
            _userProfileSummaryReadModelRepository.Add(entity);
        }

        UserProfileSummaryReadModelMapper.ApplyProfileSummary(entity, userId, displayName, avatarUrl, now);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private List<Guid> ResolveProfileIdsToRefresh(
        IReadOnlyCollection<Guid> distinctUserIds,
        IReadOnlyDictionary<Guid, UserProfileSummaryReadModel> cachedEntities,
        TimeSpan profileCacheTtl,
        bool requireFresh)
    {
        if (requireFresh)
        {
            return distinctUserIds.ToList();
        }

        return distinctUserIds
            .Where(userId =>
                !cachedEntities.TryGetValue(userId, out var cachedEntity)
                || IsProfileEntryStale(cachedEntity, profileCacheTtl))
            .ToList();
    }

    private async Task<bool> RefreshProfilesAsync(
        IEnumerable<Guid> idsToRefresh,
        IDictionary<Guid, UserProfileSummaryDto?> result,
        IDictionary<Guid, UserProfileSummaryReadModel> cachedEntities,
        CancellationToken cancellationToken,
        string? accessToken)
    {
        var idsToRefreshList = idsToRefresh as IReadOnlyCollection<Guid> ?? idsToRefresh.ToList();
        var fetchedProfileLookup = await FetchProfilesFromJavaAsync(idsToRefreshList, cancellationToken, accessToken);
        var fetchedProfiles = idsToRefreshList.Select(userId =>
            new KeyValuePair<Guid, UserProfileSummaryDto?>(
                userId,
                fetchedProfileLookup.TryGetValue(userId, out var profile) ? profile : null));

        return UpsertFetchedProfiles(fetchedProfiles, result, cachedEntities);
    }

    private bool UpsertFetchedProfiles(
        IEnumerable<KeyValuePair<Guid, UserProfileSummaryDto?>> fetchedProfiles,
        IDictionary<Guid, UserProfileSummaryDto?> result,
        IDictionary<Guid, UserProfileSummaryReadModel> cachedEntities)
    {
        var updated = false;
        foreach (var (userId, profile) in fetchedProfiles)
        {
            result[userId] = profile;
            if (profile is null)
            {
                continue;
            }

            var entity = GetOrCreateProfileSummaryEntity(userId, cachedEntities);

            UserProfileSummaryReadModelMapper.ApplyProfileSummary(
                entity,
                userId,
                profile.DisplayName,
                profile.AvatarUrl,
                DateTime.UtcNow);
            updated = true;
        }

        return updated;
    }

    private UserProfileSummaryReadModel GetOrCreateProfileSummaryEntity(
        Guid userId,
        IDictionary<Guid, UserProfileSummaryReadModel> cachedEntities)
    {
        if (cachedEntities.TryGetValue(userId, out var entity))
        {
            return entity;
        }

        entity = new UserProfileSummaryReadModel
        {
            UserId = userId
        };
        _userProfileSummaryReadModelRepository.Add(entity);
        cachedEntities[userId] = entity;
        return entity;
    }

    private async Task<IReadOnlyDictionary<Guid, UserProfileSummaryDto>> FetchProfilesFromJavaAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken,
        string? accessToken)
    {
        try
        {
            return await _javaUserProfileApiService.GetProfileSummariesByUserIdsAsync(
                userIds,
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
                "Could not refresh profile summaries from Java. UserCount={UserCount}.",
                userIds.Count);
            return new Dictionary<Guid, UserProfileSummaryDto>();
        }
    }

    private static TimeSpan ResolveProfileCacheTtl(int ttlSeconds)
    {
        if (ttlSeconds <= 0)
        {
            return TimeSpan.Zero;
        }

        return TimeSpan.FromSeconds(Math.Min(ttlSeconds, 86400));
    }

    private static bool IsProfileEntryStale(UserProfileSummaryReadModel profile, TimeSpan profileCacheTtl)
    {
        if (profileCacheTtl == TimeSpan.Zero)
        {
            return true;
        }

        return DateTime.UtcNow - profile.UpdatedAtUtc >= profileCacheTtl;
    }
}



