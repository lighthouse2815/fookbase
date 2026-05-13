using InteractHub.Api.Application.DTOs.JavaApi;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IUserProfileSummaryReadModelService
{
    Task<Dictionary<Guid, UserProfileSummaryDto?>> GetProfileSummariesAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null);

    Task UpsertProfileAsync(
        Guid userId,
        string? displayName,
        string? avatarUrl,
        DateTime? observedAtUtc,
        CancellationToken cancellationToken);
}



