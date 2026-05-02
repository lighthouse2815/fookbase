namespace InteractHub.Api.Application.Interfaces.Services;

public interface IUserReadModelProjector
{
    Task UpsertProfileAsync(
        Guid userId,
        string? displayName,
        string? avatarUrl,
        DateTime? observedAtUtc,
        CancellationToken cancellationToken);

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
