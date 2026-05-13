using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IAppReviewRepository
{
    Task<(IReadOnlyList<AppReview> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        int? rating,
        bool? isHidden,
        CancellationToken cancellationToken);

    Task<AppReview?> GetByIdAsync(Guid reviewId, CancellationToken cancellationToken);

    Task<AppReview?> GetByIdForUpdateAsync(Guid reviewId, CancellationToken cancellationToken);

    Task<AppReview?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken);

    Task<AppReview?> GetByUserIdForUpdateAsync(Guid userId, CancellationToken cancellationToken);

    Task<Dictionary<int, int>> GetPublicRatingDistributionAsync(CancellationToken cancellationToken);

    Task<double> GetPublicAverageRatingAsync(CancellationToken cancellationToken);

    Task<int> CountPublicAsync(CancellationToken cancellationToken);

    Task AddAsync(AppReview appReview, CancellationToken cancellationToken);

    void Remove(AppReview appReview);
}



