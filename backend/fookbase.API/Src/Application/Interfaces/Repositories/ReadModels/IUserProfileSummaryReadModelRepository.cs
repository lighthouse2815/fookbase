using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IUserProfileSummaryReadModelRepository
{
    Task<Dictionary<Guid, UserProfileSummaryReadModel>> GetByUserIdsAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken);

    Task<UserProfileSummaryReadModel?> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken);

    void Add(UserProfileSummaryReadModel profile);
}



