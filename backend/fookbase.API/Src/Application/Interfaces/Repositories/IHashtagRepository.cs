using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IHashtagRepository
{
    Task<(IReadOnlyList<Hashtag> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<(IReadOnlyList<Hashtag> Items, int TotalCount)> SearchPagedAsync(string keyword, int page, int pageSize, CancellationToken cancellationToken);

    Task<Hashtag?> GetByIdAsync(Guid hashtagId, CancellationToken cancellationToken);

    Task<Hashtag?> GetByIdForUpdateAsync(Guid hashtagId, CancellationToken cancellationToken);

    Task<Hashtag?> GetByNormalizedNameAsync(string normalizedName, CancellationToken cancellationToken);

    Task<int> CountPostUsageAsync(Guid hashtagId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Hashtag>> GetByNormalizedNamesAsync(IEnumerable<string> normalizedNames, CancellationToken cancellationToken);

    Task AddAsync(Hashtag hashtag, CancellationToken cancellationToken);

    Task AddRangeAsync(IEnumerable<Hashtag> hashtags, CancellationToken cancellationToken);

    void Remove(Hashtag hashtag);
}
