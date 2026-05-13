namespace InteractHub.Api.Application.Interfaces.Services;

public interface IFriendshipReadModelService
{
    Task<Dictionary<Guid, DateTime>> ResolveBlockedUsersAsync(
        Guid ownerUserId,
        string? accessToken,
        CancellationToken cancellationToken,
        bool requireFresh = false);

    Task<HashSet<Guid>> ResolveBlockedUserIdsAsync(
        Guid? ownerUserId,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null);

    Task<HashSet<Guid>> ResolveContactIdsAsync(
        Guid ownerUserId,
        string? accessToken,
        CancellationToken cancellationToken,
        bool requireFresh = false);

    Task SetBlockedRelationAsync(
        Guid ownerUserId,
        Guid blockedUserId,
        bool isBlocked,
        DateTime? observedAtUtc,
        CancellationToken cancellationToken);

    Task SetFriendshipAsync(
        Guid firstUserId,
        Guid secondUserId,
        bool isActive,
        DateTime? observedAtUtc,
        CancellationToken cancellationToken);
}




