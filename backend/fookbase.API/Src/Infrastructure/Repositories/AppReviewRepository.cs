using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class AppReviewRepository : IAppReviewRepository
{
    private readonly AppDbContext _context;

    public AppReviewRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<AppReview> Items, int TotalCount)> GetPublicPagedAsync(
        int page,
        int pageSize,
        int? rating,
        CancellationToken cancellationToken)
    {
        var query = _context.AppReviews
            .AsNoTracking()
            .Where(review => !review.IsHidden);

        if (rating.HasValue)
        {
            query = query.Where(review => review.Rating == rating.Value);
        }

        query = query.OrderByDescending(review => review.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(IReadOnlyList<AppReview> Items, int TotalCount)> GetAdminPagedAsync(
        int page,
        int pageSize,
        int? rating,
        bool? isHidden,
        CancellationToken cancellationToken)
    {
        var query = _context.AppReviews.AsNoTracking().AsQueryable();

        if (rating.HasValue)
        {
            query = query.Where(review => review.Rating == rating.Value);
        }

        if (isHidden.HasValue)
        {
            query = query.Where(review => review.IsHidden == isHidden.Value);
        }

        query = query.OrderByDescending(review => review.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<AppReview?> GetByIdAsync(Guid reviewId, CancellationToken cancellationToken)
    {
        return _context.AppReviews
            .AsNoTracking()
            .FirstOrDefaultAsync(review => review.Id == reviewId, cancellationToken);
    }

    public Task<AppReview?> GetByIdForUpdateAsync(Guid reviewId, CancellationToken cancellationToken)
    {
        return _context.AppReviews
            .FirstOrDefaultAsync(review => review.Id == reviewId, cancellationToken);
    }

    public Task<AppReview?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _context.AppReviews
            .AsNoTracking()
            .FirstOrDefaultAsync(review => review.UserId == userId, cancellationToken);
    }

    public Task<AppReview?> GetByUserIdForUpdateAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _context.AppReviews
            .FirstOrDefaultAsync(review => review.UserId == userId, cancellationToken);
    }

    public async Task<Dictionary<int, int>> GetPublicRatingDistributionAsync(CancellationToken cancellationToken)
    {
        var grouped = await _context.AppReviews
            .AsNoTracking()
            .Where(review => !review.IsHidden)
            .GroupBy(review => review.Rating)
            .Select(group => new
            {
                Rating = group.Key,
                Count = group.Count()
            })
            .ToListAsync(cancellationToken);

        return grouped.ToDictionary(item => item.Rating, item => item.Count);
    }

    public async Task<double> GetPublicAverageRatingAsync(CancellationToken cancellationToken)
    {
        var average = await _context.AppReviews
            .AsNoTracking()
            .Where(review => !review.IsHidden)
            .Select(review => (double?)review.Rating)
            .AverageAsync(cancellationToken);

        return average ?? 0d;
    }

    public Task<int> CountPublicAsync(CancellationToken cancellationToken)
    {
        return _context.AppReviews
            .AsNoTracking()
            .CountAsync(review => !review.IsHidden, cancellationToken);
    }

    public Task AddAsync(AppReview appReview, CancellationToken cancellationToken)
    {
        return _context.AppReviews.AddAsync(appReview, cancellationToken).AsTask();
    }

    public void Remove(AppReview appReview)
    {
        _context.AppReviews.Remove(appReview);
    }
}
