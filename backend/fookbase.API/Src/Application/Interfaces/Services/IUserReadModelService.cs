using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IUserReadModelService
{
    Task<AuthorSummaryDto> ResolveAuthorAsync(
        Guid userId,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null,
        string fallbackDisplayName = "user");

    Task<Dictionary<Guid, AuthorSummaryDto>> ResolveAuthorsAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null,
        string fallbackDisplayName = "user");

    Task<Dictionary<Guid, UserProfileSummaryDto?>> ResolveProfileLookupAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken,
        bool requireFresh = false,
        string? accessToken = null);

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
}
